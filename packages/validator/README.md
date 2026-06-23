<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/validator
  <br>
</h1>

<h4 align="center">Generic <a href="https://standardschema.dev">Standard Schema</a> validation middleware</h4>

<p align="center">
    <img src="https://img.shields.io/npm/v/@thrty/validator.svg">
    <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/validator
```

### Usage

`validate` works with any [Standard Schema](https://standardschema.dev)-compatible library — Zod 3.24+, Valibot 1.0+, ArkType 2.0+, and others.

#### Shorthand

Validate the whole event and replace it with the validated value:

```typescript
import { compose, eventType } from '@thrty/core';
import { validate } from '@thrty/validator';
import { z } from 'zod';

const OrderPlaced = z.object({
  orderId: z.string(),
  total: z.number(),
});

export const handler = compose(
  eventType<unknown>(),
  validate(OrderPlaced),
)(async (order) => {
  // `order` is typed as { orderId: string; total: number }
});
```

#### Path

When you want to validate one field of the event in place, pass the path as the second argument. Dotted paths are supported (capped at 4 levels deep):

```typescript
import { forEachSqsRecord } from '@thrty/sqs-record-iterator';
import { validate } from '@thrty/validator';

export const handler = compose(
  typesOf<SQSHandler>(),
  forEachSqsRecord({ batchItemFailures: true }),
  validate(OrderPlaced, 'record.body'),
)(async (event) => {
  // `event.record.body` is now the validated OrderPlaced value;
  // sibling fields like `event.record.messageId` are preserved.
});
```

The path is read *and* write. The original value at that location is replaced with the validated value, and the rest of the event is untouched.

#### Object form

For asymmetric reads (transform the input before validation, e.g. parse a string, merge fields) or to provide an `onInvalid` mapper, pass an options object. `select` reads the value to validate; `path` writes it back. Use either, both, or neither:

```typescript
validate({
  schema: OrderPlaced,
  select: (event) => JSON.parse(event.body),  // read transform
  path: 'order',                              // write target (kept alongside the rest)
  onInvalid: (issues) => new MyBadRequestError(issues),
});
```

- `select` only — read via `select`, replace the whole event with the validated value.
- `path` only — read and write at the path (same as the positional form).
- `select` + `path` — read via `select`, write the validated value to the path. The original event is preserved aside from that one key.
- Neither — same as the shorthand form.

### Errors

Failed validation throws `ValidationError` (carrying `issues: readonly StandardSchemaV1.Issue[]`) by default. Pair with [`@thrty/error-handler`](../error-handler/README.md) to map it to a response shape that fits your trigger.
