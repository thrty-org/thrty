<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/sqs-record-iterator
  <br>
</h1>

<h4 align="center">A middleware to iterate over or batch process SQS records preventing boilerplate code in Lambda handlers</h4>

<p align="center">
<img src="https://img.shields.io/npm/v/@thrty/inject.svg">
  <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/sqs-record-iterator
```

### Usage
Consider the following setup not using that middleware:
```ts
type SomeMesssage = {id: string; text: string};
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
            const message: SomeMessage = JSON.parse(record.body);
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
You have to do a lot of boilerplate code, which makes the actual business code of processing one message hard to read. 
`forEachSqsRecord` lets you process one message without any of that boilerplate:
```ts
const handler = compose(
  types<SQSEvent, Promise<SQSBatchResponse>>(),
  forEachSqsRecord({
    batchItemFailures: true,
    bodyType: of<SomeMessage>,
  })
)(async (event) => {
  const message = event.record.body;
  // process message
});
```
