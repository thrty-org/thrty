import { compose, eventType } from '@thrty/core';
import { args } from '@thrty/testing';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import * as v from 'valibot';
import { z } from 'zod';
import { validate, ValidationError } from './index';

type Shape = { id: string; count: number };
const rawStandardSchema: StandardSchemaV1<unknown, Shape> = {
  '~standard': {
    version: 1,
    vendor: 'test-fixture',
    validate(value) {
      if (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as any).id === 'string' &&
        typeof (value as any).count === 'number'
      ) {
        return { value: value as Shape };
      }
      return { issues: [{ message: 'not a Shape' }] };
    },
  },
};

const fixtures: Record<string, StandardSchemaV1<unknown, Shape>> = {
  zod: z.object({ id: z.string(), count: z.number() }),
  valibot: v.object({ id: v.string(), count: v.number() }),
  'raw standard-schema': rawStandardSchema,
};

describe.each(Object.entries(fixtures))('given a %s schema', (_name, schema) => {
  describe('shorthand form', () => {
    const handler = compose(
      eventType<unknown>(),
      validate(schema),
    )(async (event) => event);

    it('should pass validated value through', async () => {
      const result = await handler(...args<unknown>({ id: 'A', count: 1 }));
      expect(result).toEqual({ id: 'A', count: 1 });
    });

    it('should throw ValidationError on invalid input', async () => {
      await expect(handler(...args<unknown>({ id: 'A', count: 'nope' }))).rejects.toBeInstanceOf(
        ValidationError,
      );
    });
  });

  describe('positional path form', () => {
    interface RawEvent {
      payload: unknown;
    }
    const handler = compose(
      eventType<RawEvent>(),
      validate(schema, 'payload'),
    )(async (event) => event);

    it('should read and write at the same key', async () => {
      const result = await handler(
        ...args<RawEvent>({ payload: { id: 'A', count: 1 } }),
      );
      expect(result).toEqual({ payload: { id: 'A', count: 1 } });
    });

    it('should throw when the value at the path fails validation', async () => {
      await expect(
        handler(...args<RawEvent>({ payload: { id: 'A', count: 'nope' } })),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('nested dotted path', () => {
    interface RawEvent {
      record: { body: unknown; messageId: string };
      eventSource: string;
    }
    const handler = compose(
      eventType<RawEvent>(),
      validate(schema, 'record.body'),
    )(async (event) => event);

    it('should write back at the nested path, preserving siblings', async () => {
      const result = await handler(
        ...args<RawEvent>({
          record: { body: { id: 'A', count: 1 }, messageId: 'M1' },
          eventSource: 'aws:sqs',
        }),
      );
      expect(result).toEqual({
        record: { body: { id: 'A', count: 1 }, messageId: 'M1' },
        eventSource: 'aws:sqs',
      });
    });
  });

  describe('object form with select + path (asymmetric)', () => {
    interface RawEvent {
      payload: unknown;
    }
    const handler = compose(
      eventType<RawEvent>(),
      validate({
        schema,
        select: (event: RawEvent) => event.payload,
        path: 'data' as const,
      }),
    )(async (event) => event);

    it('should keep the original event and attach the validated value at path', async () => {
      const result = await handler(
        ...args<RawEvent>({ payload: { id: 'A', count: 1 } }),
      );
      expect(result).toEqual({ payload: { id: 'A', count: 1 }, data: { id: 'A', count: 1 } });
    });
  });

  describe('object form with select but no path', () => {
    interface RawEvent {
      payload: unknown;
    }
    const handler = compose(
      eventType<RawEvent>(),
      validate({
        schema,
        select: (event: RawEvent) => event.payload,
      }),
    )(async (event) => event);

    it('should replace the event with the validated value', async () => {
      const result = await handler(
        ...args<RawEvent>({ payload: { id: 'A', count: 1 } }),
      );
      expect(result).toEqual({ id: 'A', count: 1 });
    });
  });

  describe('object form with onInvalid', () => {
    class CustomError extends Error {
      constructor(public issues: readonly { message: string }[]) {
        super('custom');
      }
    }
    const handler = compose(
      eventType<unknown>(),
      validate({
        schema,
        onInvalid: (issues) => new CustomError(issues),
      }),
    )(async (event) => event);

    it('should throw the custom error', async () => {
      await expect(handler(...args<unknown>({}))).rejects.toBeInstanceOf(CustomError);
    });
  });
});

describe('type inference', () => {
  it('infers the validated output as the next event (shorthand)', () => {
    const schema = z.object({ id: z.string() });
    compose(
      eventType<unknown>(),
      validate(schema),
    )(async (event) => {
      const id: string = event.id;
      return id;
    });
  });

  it('replaces the value at the path (positional, top-level)', () => {
    interface RawEvent {
      payload: unknown;
      meta: { traceId: string };
    }
    const schema = z.object({ id: z.string() });
    compose(
      eventType<RawEvent>(),
      validate(schema, 'payload'),
    )(async (event) => {
      const traceId: string = event.meta.traceId;
      const id: string = event.payload.id;
      return { traceId, id };
    });
  });

  it('replaces the value at the path (positional, nested)', () => {
    interface RawEvent {
      record: { body: unknown; messageId: string };
      eventSource: string;
    }
    const schema = z.object({ id: z.string() });
    compose(
      eventType<RawEvent>(),
      validate(schema, 'record.body'),
    )(async (event) => {
      const id: string = event.record.body.id;
      const msg: string = event.record.messageId;
      const src: string = event.eventSource;
      return { id, msg, src };
    });
  });

  it('attaches the validated value at a new path when `select` is provided', () => {
    interface RawEvent {
      payload: unknown;
      meta: { traceId: string };
    }
    const schema = z.object({ id: z.string() });
    compose(
      eventType<RawEvent>(),
      validate({
        schema,
        select: (e: RawEvent) => e.payload,
        path: 'data' as const,
      }),
    )(async (event) => {
      const traceId: string = event.meta.traceId;
      const id: string = event.data.id;
      return { traceId, id };
    });
  });
});
