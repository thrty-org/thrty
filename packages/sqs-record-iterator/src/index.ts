import { SQSBatchResponse, SQSEvent, SQSRecord, SQSBatchItemFailure } from 'aws-lambda';
import { Middleware, TypeRef } from '@thrty/core';

type ForeachRequiredEvent = SQSEvent;
type ForeachNextEvent<TEvent extends ForeachRequiredEvent, TBody> = Omit<TEvent, 'Records'> & {
  record: Omit<SQSRecord, 'body'> & { body: TBody };
};
interface ForeachRecordOptions<TBatchItemFailures, TBody, TRaw extends boolean> {
  bodyType?: TypeRef<TBody>;
  batchItemFailures: TBatchItemFailures;
  sequential?: boolean;
  /**
   * When set, the record body is passed through as the raw `string` rather
   * than `JSON.parse`d. Useful for composing with a downstream validator
   * that parses + validates in one step.
   */
  raw?: TRaw;
}

export const forEachSqsRecord =
  <
    TEvent extends ForeachRequiredEvent,
    TContext,
    TBody,
    TBatchItemFailures extends boolean,
    TRaw extends boolean = false,
  >({
    batchItemFailures: useBatchItemFailures,
    sequential,
    raw,
  }: ForeachRecordOptions<TBatchItemFailures, TBody, TRaw>): Middleware<
    TEvent,
    ForeachNextEvent<TEvent, TRaw extends true ? string : TBody>,
    Promise<TBatchItemFailures extends true ? SQSBatchResponse : void>,
    Promise<void>,
    TContext,
    TContext
  > =>
  (next) =>
  async ({ Records, ...event }, context, ..._rest) => {
    const handleRecord = async ({ body, ...record }: SQSRecord) => {
      const parsedBody = raw ? body : (JSON.parse(body) as TBody);
      await next(
        {
          ...event,
          record: {
            ...record,
            body: parsedBody,
          },
        } as ForeachNextEvent<TEvent, TRaw extends true ? string : TBody>,
        context,
      );
    };
    const isBatchItemFailure = (
      failure: SQSBatchItemFailure | undefined,
    ): failure is SQSBatchItemFailure => !!failure;
    const contextDeps = (
      context as { deps?: { logger?: { error: (...args: any[]) => any } } } | undefined
    )?.deps;
    const handleRecordWithBatchItemFailure = async (record: SQSRecord) => {
      try {
        await handleRecord(record);
      } catch (e) {
        (contextDeps?.logger ?? console).error(e);
        return {
          itemIdentifier: record.messageId,
        } satisfies SQSBatchItemFailure;
      }
    };

    if (sequential) {
      if (useBatchItemFailures) {
        const batchItemFailures: SQSBatchItemFailure[] = [];
        for (const record of Records) {
          if (batchItemFailures.length) {
            batchItemFailures.push({
              itemIdentifier: record.messageId,
            });
          } else {
            const result = await handleRecordWithBatchItemFailure(record);
            if (isBatchItemFailure(result)) {
              batchItemFailures.push(result);
            }
          }
        }
        return { batchItemFailures };
      }
      for (const record of Records) {
        await handleRecord(record);
      }
      return;
    }

    if (useBatchItemFailures) {
      return {
        batchItemFailures: (
          await Promise.all(Records.map(handleRecordWithBatchItemFailure))
        ).filter(isBatchItemFailure),
      };
    }
    await Promise.all(Records.map(handleRecord));
    return undefined as any;
  };
