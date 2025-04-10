<h1 align="center">
  <img src="assets/logo.svg" alt="thirty" width="150">
  <br>
  thrty
  <br>
</h1>

<h4 align="center">A middleware engine for AWS Lambda, that makes Lambda Functions type-safe, easy to develop and test.</h4>

<p align="center">
  <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

## Installation

```shell script
npm install @thrty/core
```

## Getting started

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

## Testing

The `compose`d handler function exposes a reference to the actual handler
via the `actual` property:

```typescript
// handler.spec.ts
import { fromPartial, createMock } from '@thrty/testing'
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
  
  const { statusCode, body } = await handler.actual(eventMock);
  
  const expectedUser = { /*...*/ };
  expect(statusCode).toBe(201);
  expect(body).toEqual(expectedUser);
});
```
This makes it easily possible to test the business code without retesting middleware-functionality again.

## Documentation
coming soon...