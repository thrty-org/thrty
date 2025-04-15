<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/api
  <br>
</h1>

<h4 align="center">Middlewares used to describe an API endpoint</h4>

<p align="center">
    <img src="https://img.shields.io/npm/v/@thrty/api.svg">
    <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/api
```

### Usage

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { compose, types } from '@thrty/core';
import { authorizer, get } from '@thrty/api';
import { inject } from '@thrty/inject';
import { responseBody } from '@thrty/api-zod';
import { NotFoundError } from '@thrty/http-errors';
import { httpErrorHandler } from '@thrty/http-error-handler';

export const handler = compose(
  typesOf<APIGatewayProxyHandler>(),
  inject({
    ...todoRepositoryProviders,
  }),
  httpErrorHandler(),
  get('/todos/{todoId}'),
  authorizer('default'),
  responseBody(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })),
)(async event => {
  const { todoRepository } = event.deps;
  const todo = await todoRepository.findById(event.routeParams.todoId);

  if (!todo) {
    throw new NotFoundError('Todo not found');
  }

  return {
    statusCode: 200,
    body: todo,
  };
});
```

Use [`@thrty/api-cdk`](../api-cdk/README.md) to create an API Gateway out of defined handlers.

```typescript
import { Api } from '@thrty/api-cdk';

export class CustomStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new Api(this, 'Api', {
      restApiName: 'Todos',
      pattern: join(__dirname, '..', '__fixtures__', '*Lambda.ts'),
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
  }
}
```

