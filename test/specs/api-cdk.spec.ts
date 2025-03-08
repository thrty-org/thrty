import { App, Stack } from 'aws-cdk-lib';
import { Capture, Template } from 'aws-cdk-lib/assertions';
import { join } from 'path';
import { Api } from '@thrty/api-cdk';
import { createHash } from 'crypto';
import { HttpMethod } from '@thrty/api';

let template: Template;

beforeAll(() => {
  const stack = new Stack(new App(), 'Test');
  new Api(stack, 'TodoApi', {
    restApiName: 'Todos',
    pattern: join(__dirname, '__fixtures__', '*Lambda.ts'),
    basePathMapping: {
      path: 'todos',
      domainNames: ['api.thrty.com'],
    },
    authorizers: {
      default: {
        type: 'REQUEST',
        lambdaArn: 'arn:aws:lambda:eu-central-1:123456789:function:defaultauthorizer',
      },
    },
  });

  template = Template.fromStack(stack);
});

it('should create "RestApi"', () => {
  template.hasResourceProperties('AWS::ApiGateway::RestApi', {
    Name: 'Todos',
  });
});

it('should create "Stage" with stage variables for all endpoints', () => {
  const createKey = (method: HttpMethod, path: string, key: string) =>
    createHash('sha1').update(`${key}${method.toLowerCase()}_${path}`, 'utf8').digest('hex');
  const toBase64 = (value: string) => Buffer.from(value, 'utf8').toString('base64');

  template.hasResourceProperties('AWS::ApiGateway::Stage', {
    Variables: {
      [createKey('get', '/todos', 'scopes')]: toBase64(JSON.stringify(['todo:read'])),
      [createKey('patch', '/todos/{todoId}', 'scopes')]: toBase64(JSON.stringify(['todo:update'])),
      [createKey('post', '/todos', 'scopes')]: toBase64(JSON.stringify(['todo:create'])),
    },
  });
});

it('should create fallback "Resource" and "Method" to respond with 404', () => {
  template.hasResourceProperties('AWS::ApiGateway::Resource', {
    PathPart: '{fallback+}',
  });
  template.hasResourceProperties('AWS::ApiGateway::Method', {
    AuthorizationType: 'NONE',
    HttpMethod: 'ANY',
    Integration: {
      IntegrationResponses: [
        {
          ResponseTemplates: {
            'application/json': '{"message":"Resource not found"}',
          },
          StatusCode: '404',
        },
      ],
      PassthroughBehavior: 'WHEN_NO_MATCH',
      RequestTemplates: {
        'application/json': '{"statusCode":404}',
      },
      Type: 'MOCK',
    },
  });
});

it('should create all endpoints properly', () => {
  template.hasResourceProperties('AWS::ApiGateway::Resource', {
    PathPart: 'todos',
  });
  template.hasResourceProperties('AWS::ApiGateway::Resource', {
    PathPart: '{todoId}',
  });

  // GET /todos
  const getAuthorizerIdCapture = new Capture();
  const getLambdaCapture = new Capture();
  template.hasResourceProperties('AWS::ApiGateway::Method', {
    AuthorizationType: 'CUSTOM',
    AuthorizerId: {
      'Fn::GetAtt': [getAuthorizerIdCapture, 'AuthorizerId'],
    },
    HttpMethod: 'GET',
    Integration: {
      IntegrationHttpMethod: 'POST',
      Type: 'AWS_PROXY',
      Uri: {
        'Fn::Join': [
          '',
          [
            'arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':apigateway:',
            {
              Ref: 'AWS::Region',
            },
            ':lambda:path/2015-03-31/functions/',
            {
              'Fn::GetAtt': [getLambdaCapture, 'Arn'],
            },
            '/invocations',
          ],
        ],
      },
    },
  });
  expect(getAuthorizerIdCapture.asString()).toEqual(expect.stringContaining('TodoApidefault'));
  expect(getLambdaCapture.asString()).toEqual(expect.stringContaining('TodoApiGetTodosLambda'));

  // POST /todos
  const createAuthorizerIdCapture = new Capture();
  const createLambdaCapture = new Capture();
  template.hasResourceProperties('AWS::ApiGateway::Method', {
    AuthorizationType: 'CUSTOM',
    AuthorizerId: {
      'Fn::GetAtt': [createAuthorizerIdCapture, 'AuthorizerId'],
    },
    HttpMethod: 'POST',
    Integration: {
      IntegrationHttpMethod: 'POST',
      Type: 'AWS_PROXY',
      Uri: {
        'Fn::Join': [
          '',
          [
            'arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':apigateway:',
            {
              Ref: 'AWS::Region',
            },
            ':lambda:path/2015-03-31/functions/',
            {
              'Fn::GetAtt': [createLambdaCapture, 'Arn'],
            },
            '/invocations',
          ],
        ],
      },
    },
  });
  expect(createAuthorizerIdCapture.asString()).toEqual(expect.stringContaining('TodoApidefault'));
  expect(createLambdaCapture.asString()).toEqual(
    expect.stringContaining('TodoApiCreateTodoLambda'),
  );

  // PATCH /todos/{todoId}
  const patchAuthorizerIdCapture = new Capture();
  const patchLambdaCapture = new Capture();
  template.hasResourceProperties('AWS::ApiGateway::Method', {
    AuthorizationType: 'CUSTOM',
    AuthorizerId: {
      'Fn::GetAtt': [patchAuthorizerIdCapture, 'AuthorizerId'],
    },
    HttpMethod: 'PATCH',
    Integration: {
      IntegrationHttpMethod: 'POST',
      Type: 'AWS_PROXY',
      Uri: {
        'Fn::Join': [
          '',
          [
            'arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':apigateway:',
            {
              Ref: 'AWS::Region',
            },
            ':lambda:path/2015-03-31/functions/',
            {
              'Fn::GetAtt': [patchLambdaCapture, 'Arn'],
            },
            '/invocations',
          ],
        ],
      },
    },
  });
  expect(patchAuthorizerIdCapture.asString()).toEqual(expect.stringContaining('TodoApidefault'));
  expect(patchLambdaCapture.asString()).toEqual(expect.stringContaining('TodoApiPatchTodoLambda'));
});

it('should create "BasePathMapping" for all domain names', () => {
  template.hasResourceProperties('AWS::ApiGateway::BasePathMapping', {
    BasePath: 'todos',
    DomainName: 'api.thrty.com',
  });
});

it('should create authorizers', () => {
  template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
    AuthorizerUri: {
      'Fn::Join': [
        '',
        [
          'arn:aws:apigateway:',
          {
            Ref: 'AWS::Region',
          },
          ':lambda:path/2015-03-31/functions/arn:aws:lambda:eu-central-1:123456789:function:defaultauthorizer/invocations',
        ],
      ],
    },
    Name: 'default',
    Type: 'REQUEST',
  });
});

it('should create all lambdas', () => {
  template.hasResourceProperties('AWS::Lambda::Function', {
    FunctionName: 'PatchTodo',
    Handler: 'index.handler',
    Runtime: 'nodejs20.x',
    Environment: {
      Variables: {
        FOR_ALL: 'test',
      },
    },
  });
  template.hasResourceProperties('AWS::Lambda::Function', {
    FunctionName: 'TestGetTodos',
    Handler: 'index.handler',
    Runtime: 'nodejs20.x',
    Environment: {
      Variables: {
        FOR_GET_TODOS: 'test',
        FOR_ALL: 'test',
      },
    },
  });
  template.hasResourceProperties('AWS::Lambda::Function', {
    FunctionName: 'CreateTodo',
    Handler: 'index.handler',
    Runtime: 'nodejs20.x',
    Environment: {
      Variables: {
        FOR_CREATE_TODO: 'test',
        FOR_ALL: 'test',
      },
    },
  });
});
