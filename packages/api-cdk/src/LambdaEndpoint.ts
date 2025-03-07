import { Construct } from 'constructs';
import { ILambdaEndpoint } from './ILambdaEndpoint';
import { IFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ApiLambdaMeta } from './getApiLambdaMeta';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs/lib/function';
import { LambdaIntegrationOptions, MethodOptions } from 'aws-cdk-lib/aws-apigateway';

export type LambdaEndpointProps = ApiLambdaMeta & {
  callback?: (scope: Construct, fn: IFunction) => any;
};

export class LambdaEndpoint extends Construct implements ILambdaEndpoint {
  fn: IFunction;
  integrationOptions: LambdaIntegrationOptions | undefined;
  methodOptions: MethodOptions | undefined;

  constructor(
    scope: Construct,
    id: string,
    protected props: LambdaEndpointProps,
  ) {
    super(scope, id);
    this.fn = this.createFunction();
    this.props.callback?.(this, this.fn);
  }

  protected createFunction(overrides: Partial<NodejsFunctionProps> = {}): IFunction {
    return new NodejsFunction(this, 'Lambda', {
      functionName: this.props.name,
      entry: this.props.path,
      runtime: Runtime.NODEJS_20_X,
      ...overrides,
    });
  }
}
