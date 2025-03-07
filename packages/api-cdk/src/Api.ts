import { Construct } from 'constructs';
import {
  AuthorizationType,
  CfnAuthorizer,
  CfnAuthorizerProps,
  CfnBasePathMapping,
  IAuthorizer,
  LambdaIntegration,
  MockIntegration,
  PassthroughBehavior,
  RestApi,
  RestApiProps,
} from 'aws-cdk-lib/aws-apigateway';
import { join, parse } from 'path';
import { existsSync } from 'fs';
import { Stack } from 'aws-cdk-lib';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LambdaEndpoint, LambdaEndpointProps } from './LambdaEndpoint';
import { ApiLambdaMeta, getApiLambdaMeta } from './getApiLambdaMeta';
import { createHashedKey } from './shared/stageVariables';
import { STAGE_VARIABLE_PREFIX } from '@thrty/api';
import { GetLambdaMetaOptions } from '@thrty/meta';

export type Authorizer = Omit<CfnAuthorizerProps, 'restApiId' | 'name' | 'authorizerUri'> & {
  lambdaArn: string;
};
export interface ApiBasePathMapping {
  domainNames: string[];
  path: string;
}
export type ApiProps = RestApiProps &
  GetLambdaMetaOptions & {
    pattern: string;
    basePathMapping?: ApiBasePathMapping;
    authorizers?: { [name: string]: Authorizer };
    sharedCallbackFilename?: string;
    customLambdaEndpointConstructorMatcher?: (lambdaPath: string) => string;
    customLambdaEndpointCallbackMatcher?: (lambdaPath: string) => string;
    defaultLambdaEndpointConstruct?: typeof LambdaEndpoint;
  };
export class Api extends Construct {
  protected readonly api: RestApi;
  protected readonly apiLambdaMeta: ApiLambdaMeta[];
  private readonly authorizers: { [name: string]: IAuthorizer };
  private readonly restApiProps: RestApiProps;
  private readonly basePathMapping?: ApiBasePathMapping;
  private readonly defaultLambdaEndpointConstructor = LambdaEndpoint;
  private readonly customLambdaEndpointConstructorMatcher: (lambdaPath: string) => string;
  private readonly customLambdaEndpointCallbackMatcher: (lambdaPath: string) => string;

  constructor(
    scope: Construct,
    id: string,
    private props: ApiProps,
  ) {
    super(scope, id);

    const {
      pattern,
      authorizers,
      basePathMapping,
      customLambdaEndpointConstructorMatcher,
      customLambdaEndpointCallbackMatcher,
      defaultLambdaEndpointConstruct,
      lambdaNameTransformer,
      handlerExportName,
      ...restApiProps
    } = props;
    this.restApiProps = restApiProps;
    this.basePathMapping = basePathMapping;
    this.customLambdaEndpointConstructorMatcher =
      customLambdaEndpointConstructorMatcher ?? defaultCustomLambdaEndpointConstructorMatcher;
    this.customLambdaEndpointCallbackMatcher =
      customLambdaEndpointCallbackMatcher ?? defaultCustomLambdaEndpointCallbackMatcher;
    this.defaultLambdaEndpointConstructor =
      defaultLambdaEndpointConstruct ?? this.defaultLambdaEndpointConstructor;

    this.apiLambdaMeta = getApiLambdaMeta(pattern, {
      lambdaNameTransformer,
      handlerExportName,
    });
    this.api = this.createApi();
    this.authorizers = this.createAuthorizers();

    this.applyFallbackIfEndpointNotExists();
    this.applyLambdas();
    this.applyBasePathMapping();
  }

  private createApi() {
    return new RestApi(this, 'RestApi', {
      ...this.restApiProps,
      deployOptions: {
        ...this.restApiProps.deployOptions,
        variables: {
          ...this.restApiProps.deployOptions?.variables,
          ...this.createStageVariables(),
        },
      },
    });
  }

  private applyLambdas() {
    this.apiLambdaMeta.forEach((meta) => {
      const resource = meta.endpoint.path
        .split('/')
        .reduce((_resource, pathPart) => _resource.resourceForPath(pathPart), this.api.root);

      let lambdaEndpointConstructor = this.defaultLambdaEndpointConstructor;
      const customLambdaEndpointConstructor = this.customLambdaEndpointConstructorMatcher(
        meta.path,
      );
      if (existsSync(customLambdaEndpointConstructor)) {
        lambdaEndpointConstructor = require(customLambdaEndpointConstructor).default;
      }

      let apiLambdaCallback: LambdaEndpointProps['callback'];
      const customLambdaEndpointCallbackPath = this.customLambdaEndpointCallbackMatcher(meta.path);
      if (existsSync(customLambdaEndpointCallbackPath)) {
        apiLambdaCallback = require(customLambdaEndpointCallbackPath).default;
      } else {
        const sharedCallbackPath = findNextSharedCallback(
          meta.path,
          this.props.sharedCallbackFilename,
        );
        if (existsSync(sharedCallbackPath)) {
          apiLambdaCallback = require(sharedCallbackPath).default;
        }
      }

      const lambdaEndpoint = new lambdaEndpointConstructor(this, meta.name, {
        ...meta,
        callback: apiLambdaCallback,
      });
      if (lambdaEndpoint.methodOptions?.authorizer && meta.authorizerName) {
        throw new Error(
          'Cannot define both: "authorizer" via LambdaEndpoint#methodOptions and "authorizerName" via middleware',
        );
      }

      resource.addMethod(
        meta.endpoint.method,
        new LambdaIntegration(lambdaEndpoint.fn, {
          ...lambdaEndpoint.integrationOptions,
        }),
        {
          authorizer: meta.authorizerName ? this.getAuthorizer(meta.authorizerName) : undefined,
          ...lambdaEndpoint.methodOptions,
        },
      );
    });
  }

  private applyFallbackIfEndpointNotExists() {
    this.api.root.addResource('{fallback+}').addMethod(
      'ANY',
      new MockIntegration({
        requestTemplates: {
          'application/json': JSON.stringify({ statusCode: 404 }),
        },
        passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
        integrationResponses: [
          {
            statusCode: '404',
            responseTemplates: {
              'application/json': JSON.stringify({ message: 'Resource not found' }),
            },
          },
        ],
      }),
    );
  }

  private applyBasePathMapping() {
    this.basePathMapping?.domainNames.forEach((domainName, index) => {
      new CfnBasePathMapping(this, `BasePathMapping${index || ''}`, {
        basePath: this.basePathMapping?.path,
        domainName: domainName,
        restApiId: this.api.restApiId,
        stage: this.api.deploymentStage.stageName,
      });
    });
  }

  private createAuthorizers() {
    const role = new Role(this, 'ApiRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    const policyStatement = new PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });
    role.addToPolicy(policyStatement);

    return Object.fromEntries(
      Object.entries(this.props.authorizers ?? {}).map(([name, authorizer]) => {
        policyStatement.addResources(authorizer.lambdaArn);
        const cfnAuthorizers = new CfnAuthorizer(this, name, {
          ...authorizer,
          name,
          authorizerUri: `arn:aws:apigateway:${Stack.of(this).region}:lambda:path/2015-03-31/functions/${authorizer.lambdaArn}/invocations`,
          authorizerCredentials: role.roleArn,
          restApiId: this.api.restApiId,
          identitySource: '',
        });
        return [
          name,
          {
            authorizationType:
              (authorizer.authType as AuthorizationType) ?? AuthorizationType.CUSTOM,
            authorizerId: cfnAuthorizers.attrAuthorizerId,
          },
        ];
      }),
    );
  }

  private getAuthorizer(authorizerName: string) {
    if (!this.authorizers) {
      throw new Error('No authorizers defined in Api props');
    }
    if (!this.authorizers[authorizerName]) {
      throw new Error(`Authorizer "${authorizerName}" not found`);
    }
    return this.authorizers[authorizerName];
  }

  private createStageVariables() {
    return this.apiLambdaMeta.reduce((acc, meta) => {
      const stagesVariables = Object.keys(meta)
        .filter((key) => key.startsWith(STAGE_VARIABLE_PREFIX))
        .reduce((_acc, prefixedKey) => {
          const key = prefixedKey.replace(STAGE_VARIABLE_PREFIX, '');
          const value = meta[prefixedKey];

          return {
            ..._acc,
            [createHashedKey(meta.endpoint.method, meta.endpoint.path, key)]: Buffer.from(
              JSON.stringify(value),
              'utf8',
            ).toString('base64'),
          };
        }, {});

      return {
        ...acc,
        ...stagesVariables,
      };
    }, {});
  }
}

const defaultCustomLambdaEndpointConstructorMatcher = (lambdaPath: string) => {
  const { name, dir } = parse(lambdaPath);
  const [withoutSuffix] = name.split('Lambda');
  return join(dir, `${withoutSuffix}Construct.ts`);
};

const defaultCustomLambdaEndpointCallbackMatcher = (lambdaPath: string) => {
  const { name, dir } = parse(lambdaPath);
  const [withoutSuffix] = name.split('Lambda');
  return join(dir, `${withoutSuffix}Callback.ts`);
};

const findNextSharedCallback = (
  lambdaPath: string,
  sharedCallbackFilename = '[shared]Callback.ts',
) => {
  const { dir } = parse(lambdaPath);
  const MAX_LEVEL = 3;
  let level = 0;
  let lookupDir = dir;
  let sharedPath;
  do {
    sharedPath = join(lookupDir, sharedCallbackFilename);
    lookupDir = join(lookupDir, '..');
    level++;
  } while (!existsSync(sharedPath) && level <= MAX_LEVEL);
  return sharedPath;
};
