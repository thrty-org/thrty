<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/inject
  <br>
</h1>

<h4 align="center">Middlewares for validation and metadata describing request body, response body and query parameters with zod</h4>

<p align="center">
    <img src="https://img.shields.io/npm/v/@thrty/api.svg">
    <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/api-zod
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

### Middlewares

#### `requestBody`

Middleware to parse, validate and infer the type of request body using Zod. If request body is not valid, it will throw a `ZodBadRequestError` with the validation errors.

```typescript
export const handler = compose(
  /* ... */
  requestBody(z.object({
    title: z.string(),
  })),
)(async event => {
  // validated request body is available in event.requestBody
  event.requestBody
  /* ... */
});
```

#### `responseBody`
Middleware to serialize, infer the type and optionally validate the response body using Zod.
If returned body does not satisfy inferred type, a TypeScript throws an error.
If validation is enabled, response body is not valid, it will throw a `Error` with the validation errors.

```typescript
export const handler = compose(
  /* ... */
  responseBody(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })),
)(async event => {
  // validated request body is available in event.requestBody
  return {
    statusCode: 200,
    body: {
      id: 'cCYfM67dbtx',
      title: 'Implementing Zod middleware',
      completed: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }
  }
});
```
To enable validation pass `{ validate: true }` as second argument to `responseBody`:

#### `queryParams`
Middleware to parse, validate and infer the type of query parameters using Zod. If query parameters are not valid, it will throw a `ZodBadRequestError` with the validation errors.

```typescript
import { queryParams } from '@thrty/api-zod/src';

export const handler = compose(
  /* ... */
  queryParams(z.object({
    limit: z.string().transform(Number),
    page: z.string().transform(Number),
    sortBy: z.array(z.string()),
  })),
)(async event => {
  // validated query parameters are available in event.queryParams
  event.queryParams.limit
  /* ... */
});
```