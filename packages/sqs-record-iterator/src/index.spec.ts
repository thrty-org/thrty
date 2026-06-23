import { compose, types, of } from '@thrty/core';
import { args, fromPartial } from '@thrty/testing';
import { inject } from '@thrty/inject';
import { SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { forEachSqsRecord } from './index';

interface SomeMessageBody {
  id: string;
  description: string;
  shouldFail?: boolean;
}

describe('given sequential is false or not set', () => {
  describe('and batchItemFailures are expected', () => {
    let logError: jest.Mock;

    const createHandler = () =>
      compose(
        types<SQSEvent, Promise<SQSBatchResponse>>(),
        inject({
          logger: () => ({ error: logError }),
        }),
        forEachSqsRecord({
          batchItemFailures: true,
          bodyType: of<SomeMessageBody>,
        }),
      )(async (event) => {
        if (event.record.body.shouldFail) {
          throw new Error(`Failed to process ${event.record.messageId}`);
        }
      });

    let handler: ReturnType<typeof createHandler>;
    let result: Awaited<ReturnType<typeof handler>>;

    beforeEach(() => {
      logError = jest.fn();
      handler = createHandler();
    });

    describe('and foreachRecord#batchItemFailures is set to true', () => {
      it('should throw a ts error', () => {
        compose(
          types<SQSEvent, Promise<SQSBatchResponse>>(),
          // @ts-expect-error
          forEachSqsRecord({
            batchItemFailures: false,
            bodyType: of<SomeMessageBody>,
          }),
        )(async (event) => {});
      });
    });

    describe('and all messages can be successfully processed', () => {
      beforeEach(async () => {
        result = await handler(...args<SQSEvent>({
          Records: [
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_1',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_1',
                description: 'desc',
              } satisfies SomeMessageBody),
            }),
          ],
        }));
      });

      it('should return SQSBatchResponse with empty failures', async () => {
        expect(result.batchItemFailures).toEqual([]);
      });

      it('should log no errors', async () => {
        expect(logError).not.toHaveBeenCalled();
      });
    });

    describe('and 1 message fails to be processed', () => {
      beforeEach(async () => {
        result = await handler(...args<SQSEvent>({
          Records: [
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_1',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_1',
                description: 'desc',
                shouldFail: true,
              } satisfies SomeMessageBody),
            }),
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_2',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_2',
                description: 'desc',
              } satisfies SomeMessageBody),
            }),
          ],
        }));
      });

      it('should return SQSBatchResponse with 1 failure', async () => {
        expect(result.batchItemFailures).toEqual([
          {
            itemIdentifier: 'MESSAGE_1',
          },
        ]);
      });

      it('should log an error', async () => {
        expect(logError).toHaveBeenCalledWith(new Error('Failed to process MESSAGE_1'));
      });
    });
  });
  describe('and no batchItemFailures are expected', () => {
    const createHandler = () =>
      compose(
        types<SQSEvent, Promise<void>>(),
        forEachSqsRecord({
          batchItemFailures: false,
          bodyType: of<SomeMessageBody>,
        }),
      )(async (event) => {
        if (event.record.body.shouldFail) {
          throw new Error(`Failed to process ${event.record.messageId}`);
        }
      });

    let handler: ReturnType<typeof createHandler>;
    let promise: ReturnType<typeof handler>;

    beforeEach(() => {
      handler = createHandler();
    });

    describe('and foreachRecord#batchItemFailures is set to false', () => {
      it('should throw a ts error', () => {
        compose(
          types<SQSEvent, Promise<void>>(),
          // @ts-expect-error
          forEachSqsRecord({
            batchItemFailures: true,
            bodyType: of<SomeMessageBody>,
          }),
        )(async (event) => {});
      });
    });

    describe('and all messages can be successfully processed', () => {
      beforeEach(() => {
        promise = handler(...args<SQSEvent>({
          Records: [
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_1',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_1',
                description: 'desc',
              } satisfies SomeMessageBody),
            }),
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_2',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_2',
                description: 'desc',
              } satisfies SomeMessageBody),
            }),
          ],
        }));
      });

      it('should not throw', async () => {
        await expect(promise).resolves.toBe(undefined);
      });
    });

    describe('and 1 message fails to be processed', () => {
      beforeEach(() => {
        promise = handler(...args<SQSEvent>({
          Records: [
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_1',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_1',
                description: 'desc',
                shouldFail: true,
              } satisfies SomeMessageBody),
            }),
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_2',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_2',
                description: 'desc',
              } satisfies SomeMessageBody),
            }),
          ],
        }));
      });

      it('should throw', async () => {
        await expect(promise).rejects.toEqual(new Error('Failed to process MESSAGE_1'));
      });
    });
  });
});
describe('given raw is true', () => {
  const createHandler = () => {
    const seenBodies: unknown[] = [];
    const handler = compose(
      types<SQSEvent, Promise<void>>(),
      forEachSqsRecord({
        raw: true,
        batchItemFailures: false,
      }),
    )(async (event) => {
      seenBodies.push(event.record.body);
    });
    return { handler, seenBodies };
  };

  describe('and records contain JSON-looking strings', () => {
    let seenBodies: unknown[];

    beforeEach(async () => {
      const ctx = createHandler();
      seenBodies = ctx.seenBodies;
      await ctx.handler(...args<SQSEvent>({
        Records: [
          fromPartial<SQSRecord>({
            messageId: 'MESSAGE_1',
            body: '{"id":"MESSAGE_BODY_1"}',
          }),
        ],
      }));
    });

    it('should pass the body through as a string', () => {
      expect(seenBodies).toEqual(['{"id":"MESSAGE_BODY_1"}']);
    });
  });

  describe('and a record contains non-JSON content', () => {
    let seenBodies: unknown[];
    let promise: Promise<unknown>;

    beforeEach(() => {
      const ctx = createHandler();
      seenBodies = ctx.seenBodies;
      promise = ctx.handler(...args<SQSEvent>({
        Records: [
          fromPartial<SQSRecord>({
            messageId: 'MESSAGE_1',
            body: 'plain text — not JSON',
          }),
        ],
      }));
    });

    it('should not throw and should pass the body through unchanged', async () => {
      await expect(promise).resolves.toBeUndefined();
      expect(seenBodies).toEqual(['plain text — not JSON']);
    });
  });

  describe('type-level', () => {
    it('infers body as string when raw is true', () => {
      compose(
        types<SQSEvent, Promise<void>>(),
        forEachSqsRecord({ raw: true, batchItemFailures: false }),
      )(async (event) => {
        const _body: string = event.record.body;
      });
    });
  });
});

describe('given sequential is true', () => {
  describe('and batchItemFailures are expected', () => {
    let logError: jest.Mock;

    const createHandler = () =>
      compose(
        types<SQSEvent, Promise<SQSBatchResponse>>(),
        inject({
          logger: () => ({ error: logError }),
        }),
        forEachSqsRecord({
          batchItemFailures: true,
          sequential: true,
          bodyType: of<SomeMessageBody>,
        }),
      )(async (event) => {
        if (event.record.body.shouldFail) {
          throw new Error(`Failed to process ${event.record.messageId}`);
        }
      });

    let handler: ReturnType<typeof createHandler>;
    let result: Awaited<ReturnType<typeof handler>>;

    beforeEach(() => {
      logError = jest.fn();
      handler = createHandler();
    });

    describe('and all messages can be successfully processed', () => {
      beforeEach(async () => {
        result = await handler(...args<SQSEvent>({
          Records: [
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_1',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_1',
                description: 'desc',
              } satisfies SomeMessageBody),
            }),
          ],
        }));
      });

      it('should return SQSBatchResponse with empty failures', async () => {
        expect(result.batchItemFailures).toEqual([]);
      });

      it('should log no errors', async () => {
        expect(logError).not.toHaveBeenCalled();
      });
    });

    describe('and 1 message fails to be processed', () => {
      beforeEach(async () => {
        result = await handler(...args<SQSEvent>({
          Records: [
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_1',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_1',
                description: 'desc',
              } satisfies SomeMessageBody),
            }),
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_2',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_2',
                description: 'desc',
                shouldFail: true,
              } satisfies SomeMessageBody),
            }),
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_3',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_3',
                description: 'desc',
              } satisfies SomeMessageBody),
            }),
          ],
        }));
      });

      it('should return SQSBatchResponse with all messages after failed processed record', async () => {
        expect(result.batchItemFailures).toEqual([
          {
            itemIdentifier: 'MESSAGE_2',
          },
          {
            itemIdentifier: 'MESSAGE_3',
          },
        ]);
      });

      it('should log an error', async () => {
        expect(logError).toHaveBeenCalledWith(new Error('Failed to process MESSAGE_2'));
      });
    });
  });
  describe('and no batchItemFailures are expected', () => {
    const createHandler = () =>
      compose(
        types<SQSEvent, Promise<void>>(),
        forEachSqsRecord({
          batchItemFailures: false,
          bodyType: of<SomeMessageBody>,
        }),
      )(async (event) => {
        if (event.record.body.shouldFail) {
          throw new Error(`Failed to process ${event.record.messageId}`);
        }
      });

    let handler: ReturnType<typeof createHandler>;
    let promise: ReturnType<typeof handler>;

    beforeEach(() => {
      handler = createHandler();
    });

    describe('and all messages can be successfully processed', () => {
      beforeEach(() => {
        promise = handler(...args<SQSEvent>({
          Records: [
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_1',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_1',
                description: 'desc',
              } satisfies SomeMessageBody),
            }),
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_2',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_2',
                description: 'desc',
              } satisfies SomeMessageBody),
            }),
          ],
        }));
      });

      it('should not throw', async () => {
        await expect(promise).resolves.toBe(undefined);
      });
    });

    describe('and 1 message fails to be processed', () => {
      beforeEach(() => {
        promise = handler(...args<SQSEvent>({
          Records: [
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_1',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_1',
                description: 'desc',
                shouldFail: true,
              } satisfies SomeMessageBody),
            }),
            fromPartial<SQSRecord>({
              messageId: 'MESSAGE_2',
              body: JSON.stringify({
                id: 'MESSAGE_BODY_2',
                description: 'desc',
              } satisfies SomeMessageBody),
            }),
          ],
        }));
      });

      it('should throw', async () => {
        await expect(promise).rejects.toEqual(new Error('Failed to process MESSAGE_1'));
      });
    });
  });
});
