<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/retry
  <br>
</h1>

<h4 align="center">A middleware for retrying within lambda handlers</h4>

<p align="center">
    <img src="https://img.shields.io/npm/v/@thrty/retry.svg">
  <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/retry
```

### Usage
Since the AWS Lambda service only allows 2 reties, this middleware can be helpful to increase the number of retries and also
control on which errors to retry.

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { compose, types } from '@thrty/core';
import { retry } from '@thrty/retry';
import { httpErrorHandler } from '@thrty/http-error-handler';

export const handler = compose(
  typesOf<APIGatewayProxyHandler>(),
  inject({
    ...todoRepositoryProviders,
  }),
  httpErrorHandler(),
  retry(),
)(async event => {
  /* ... */
});
```
> [!IMPORTANT]
> The middleware should be used after the `httpErrorHandler` middleware, so that it's able to receive unhandled errors and therefore know whether to retry or not.

### Options
The `retry` middleware accepts an options object with the following properties:

```typescript
export interface RetryOptions {
  /**
   * Maximum number of retries before giving up.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds.
   * @default 0
   */
  delay?: number;

  /**
   * Provide a callback, which receives the thrown error and return true if the error is retriable
   * or pass an array of errors constructors to retry on.
   * If not provided, all errors will be retried.
   */
  retryOn?: ((error: unknown) => boolean) | Array<new () => Error>;

  /**
   * Logger to use for logging errors.
   * If not provided, console will be used or logger from inject middleware if available
   * If set to false, no logging will be done.
   * @default false
   */
  logger?: false | { info(...args: any[]): any };
}
```