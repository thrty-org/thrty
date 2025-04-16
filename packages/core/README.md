<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/core
  <br>
</h1>

<h4 align="center">
    Core framework of thrty, provides type-safe compose function and utility types
    <br>
    <span style="font-weight: lighter">Zero dependency and light weight framework (~353 bytes)</span>
</h4>

<p align="center">
    <img src="https://img.shields.io/npm/v/@thrty/api.svg">
    <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/core
```

### Usage

#### `typesOf`

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { compose, typesOf } from '@thrty/core';
import { httpErrorHandler } from '@thrty/http-error-handler';
import { inject } from '@thrty/inject';
import { parseJson } from '@thrty/http-json-body-parser';
import { serializeJson } from '@thrty/http-json-body-serializer';

export const handler = compose(
  typesOf<APIGatewayProxyHandler>(),
  inject({
    userService: userServiceFactory,
  }),
  httpErrorHandler(),
  parseJson(),
  serializeJson(),
)(async event => {
  const { userService } = event.deps;
  const user = await userService.createUser(event.jsonBody);
  return {
    statusCode: 201,
    body: user,
  };
});
```

#### `types`
For custom event and return types:
```typescript
import { compose, types } from '@thrty/core';

export const handler = compose(
  types<{}, Promise<void>(),
  inject({
    userService: userServiceFactory,
  }),
)(async event => {
  const { userService } = event.deps;
  const user = await userService.createUser(event.jsonBody);
});
```

### Testing

The `compose`d handler function exposes a reference to the actual handler
via the `actual` property:

```typescript
// handler.spec.ts
import { fromPartial, createMock, EventOf } from '@thrty/testing'
import { handler } from './handler';

const userService = createMock<UserService>();
type Event = EventOf<typeof handler>;

it('should return created user', async () => {
  const user = { /*...*/ };
  userService.createUser.mockResolvedValue(user);
  const event = fromPartial<Event>({
    deps: { userService },
    jsonBody: user,
  });
  
  const { statusCode, body } = await handler.actual(event);
  
  const expectedUser = { /*...*/ };
  expect(statusCode).toBe(201);
  expect(body).toEqual(expectedUser);
});
```
This makes it easily possible to test the business code without retesting middleware-functionality again.