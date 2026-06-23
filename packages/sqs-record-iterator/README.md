<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/sqs-record-iterator
  <br>
</h1>

<h4 align="center">A middleware to iterate over or batch process SQS records preventing boilerplate code in Lambda handlers</h4>

<p align="center">
<img src="https://img.shields.io/npm/v/@thrty/sqs-record-iterator.svg">
  <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/sqs-record-iterator
```

### Usage

Consider the following setup not using that middleware. The handler has to iterate the batch, parse and validate each record body, and translate failures into `batchItemFailures` by hand:

```ts
import { z } from 'zod';

const SomeMessage = z.object({ id: z.string(), text: z.string() });
type SomeMessage = z.infer<typeof SomeMessage>;
```

```ts
const handler = compose(
  types<SQSEvent, Promise<SQSBatchResponse>>(),
)(async (event) => {
  return {
    batchItemFailures: (
      await Promise.all(
        event.Records.map((record) => {
          try {
            const message: SomeMessage = SomeMessage.parse(JSON.parse(record.body));
            // process message
          } catch (e) {
            return {
              itemIdentifier: record.messageId,
            };
          }
        }),
      )
    ).filter((maybeItemFailure): maybeItemFailure is SQSBatchItemFailure => !!maybeItemFailure),
  };
});
```

That's a lot of plumbing for what should be "for each message, do this." `forEachSqsRecord` combined with [`@thrty/validator`](../validator/README.md) lets you express the same thing as a chain — iteration, JSON parsing, and schema validation are all middleware:

```ts
import { compose, types } from '@thrty/core';
import { forEachSqsRecord } from '@thrty/sqs-record-iterator';
import { validate } from '@thrty/validator';
import { z } from 'zod';

const SomeMessage = z.object({ id: z.string(), text: z.string() });

const handler = compose(
  types<SQSEvent, Promise<SQSBatchResponse>>(),
  forEachSqsRecord({ batchItemFailures: true }),
  validate(SomeMessage, 'record.body'),
)(async (event) => {
  // `event.record.body` is typed as { id: string; text: string } AND verified at runtime
});
```

Pair this with [`@thrty/error-handler`](../error-handler/README.md) (registered earlier in the chain) if you want validation failures to be acknowledged rather than retried — the iterator's `batchItemFailures` then only catches unexpected errors.

### Skipping validation

If the producer is fully trusted and you only need a type hint, use `bodyType` to assert the body's shape without a runtime check:

```ts
const handler = compose(
  types<SQSEvent, Promise<SQSBatchResponse>>(),
  forEachSqsRecord({
    batchItemFailures: true,
    bodyType: of<SomeMessage>,
  }),
)(async (event) => {
  const message = event.record.body;
  // process message
});
```

`bodyType` is a TypeScript-only assertion — the body is parsed with `JSON.parse` and trusted to match. If a producer ever sends something else, the lie surfaces inside your business code, which is why pairing with `validate` is the recommended default.

### Non-JSON payloads

If your records aren't JSON (plain text, base64-encoded binary, Avro, protobuf, ...), set `raw: true` to skip the default `JSON.parse` and receive the body as a `string`. You can then do your own decoding inside `validate`'s `select`:

```ts
forEachSqsRecord({ raw: true, batchItemFailures: true }),
validate({
  schema: SomeMessage,
  select: (event) => decodeAvro(event.record.body),
  path: 'record.body',
}),
```
