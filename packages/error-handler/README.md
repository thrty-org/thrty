<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/error-handler
  <br>
</h1>

<h4 align="center">Catch, log, and optionally transform errors from downstream middlewares</h4>

<p align="center">
    <img src="https://img.shields.io/npm/v/@thrty/error-handler.svg">
    <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/error-handler
```

### Usage

`errorHandler` catches every error thrown by middlewares registered *after* it in the `compose` chain. By default it logs the error and **rethrows it** — which is what most event-triggered lambdas (SQS, EventBridge, S3, Kinesis, …) want, because the trigger's retry / DLQ semantics rely on the invocation failing.

```typescript
import { compose, typesOf } from '@thrty/core';
import { errorHandler } from '@thrty/error-handler';
import type { SQSHandler } from 'aws-lambda';

export const handler = compose(
  typesOf<SQSHandler>(),
  errorHandler(),
)(async (event) => {
  // any throw below this point is logged via console.error and rethrown
});
```

#### Custom logger

Pair with [`@thrty/inject`](../inject/README.md) to route logs through your own logger. `errorHandler` picks up `context.deps.logger` automatically.

```typescript
compose(
  typesOf<SQSHandler>(),
  inject({ logger: () => createLogger() }),
  errorHandler(),
)(async (event, context) => { /* … */ });
```

Pass an explicit logger to override, or `false` to suppress logging entirely.

#### Mapping errors

Return `Promise.reject(...)` from `onError` to map domain errors to infrastructure errors before they reach the trigger. Prefer `Promise.reject` over `throw` for propagation — it skips an extra async stack frame and reads as "this is a rejection," not a fresh failure site.

```typescript
errorHandler({
  onError: (error) =>
    error instanceof DomainError
      ? Promise.reject(new InfrastructureError(error))
      : Promise.reject(error),
});
```

#### Substituting a result

If your trigger expects a response (HTTP, AppSync, …) you can return a value from `onError` to use it as the lambda's result. Be deliberate: returning a value makes the lambda invocation *succeed*, so retry and DLQ logic will not fire.

```typescript
errorHandler({
  onError: (error) => ({
    statusCode: 500,
    body: JSON.stringify({ message: 'Internal Server Error' }),
  }),
});
```

For HTTP APIs specifically, prefer [`@thrty/http-error-handler`](../http-error-handler/README.md), which is a thin preset over this package with sensible defaults for `APIGatewayProxyResult` shape and message obfuscation.

### Ordering

`errorHandler` only sees errors from middlewares and the handler registered *after* it. Place it early in the chain — typically right after dependency injection — so it sits above the middlewares that may throw.

Note that some middlewares catch internally rather than rethrowing. [`@thrty/sqs-record-iterator`](../sqs-record-iterator/README.md) with `batchItemFailures: true` is one such case: it handles per-record failures itself, so an `errorHandler` placed after it would never see those errors.

