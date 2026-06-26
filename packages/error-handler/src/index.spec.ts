import { compose, eventType } from '@thrty/core';
import { inject } from '@thrty/inject';
import { args } from '@thrty/testing';
import { catchErrors } from './index';

class MappedError extends Error {
  constructor(public readonly cause: unknown) {
    super('mapped');
    this.name = 'MappedError';
  }
}

describe('catchErrors', () => {
  it('passes through when the handler does not throw', async () => {
    const handler = compose(
      eventType<{ ok: true }>(),
      catchErrors({ logger: false }),
    )(async () => 'ok');

    await expect(handler(...args<{ ok: true }>({ ok: true }))).resolves.toBe('ok');
  });

  it('logs and rethrows by default — preserves DLQ / retry semantics', async () => {
    const error = new Error('boom');
    const handler = compose(
      eventType<{}>(),
      catchErrors({ logger: false }),
    )(async () => {
      throw error;
    });

    await expect(handler(...args<{}>({}))).rejects.toBe(error);
  });

  it('rethrows when onError is omitted but logger is configured', async () => {
    const logError = jest.fn();
    const error = new Error('boom');
    const handler = compose(
      eventType<{}>(),
      catchErrors({ logger: { error: logError } }),
    )(async () => {
      throw error;
    });

    await expect(handler(...args<{}>({}))).rejects.toBe(error);
    expect(logError).toHaveBeenCalledWith(error);
  });

  it('substitutes the result when onError returns a value', async () => {
    const handler = compose(
      eventType<{ id: string }>(),
      catchErrors({
        logger: false,
        onError: (_error, { event }) => ({ fallback: event.id }),
      }),
    )(async () => {
      throw new Error('boom');
    });

    await expect(handler(...args<{ id: string }>({ id: 'X' }))).resolves.toEqual({
      fallback: 'X',
    });
  });

  it('propagates a mapped error when onError throws', async () => {
    const handler = compose(
      eventType<{}>(),
      catchErrors({
        logger: false,
        onError: (error) => {
          throw new MappedError(error);
        },
      }),
    )(async () => {
      throw new Error('original');
    });

    await expect(handler(...args<{}>({}))).rejects.toBeInstanceOf(MappedError);
  });

  it('propagates a mapped error when onError returns Promise.reject(...)', async () => {
    const handler = compose(
      eventType<{}>(),
      catchErrors({
        logger: false,
        onError: (error) => Promise.reject(new MappedError(error)),
      }),
    )(async () => {
      throw new Error('original');
    });

    await expect(handler(...args<{}>({}))).rejects.toBeInstanceOf(MappedError);
  });

  it('passes event and context to onError', async () => {
    const onError = jest.fn().mockResolvedValue('handled');
    const handler = compose(
      eventType<{ id: string }>(),
      catchErrors({ logger: false, onError }),
    )(async () => {
      throw new Error('boom');
    });

    await handler(...args<{ id: string }>({ id: 'X' }));
    const [, ctx] = onError.mock.calls[0];
    expect(ctx.event).toEqual({ id: 'X' });
    expect(typeof ctx.context.getRemainingTimeInMillis).toBe('function');
  });

  it('logs caught errors with options.logger', async () => {
    const logError = jest.fn();
    const handler = compose(
      eventType<{}>(),
      catchErrors({
        logger: { error: logError },
        onError: () => undefined as unknown as void,
      }),
    )(async () => {
      throw new Error('boom');
    });

    await handler(...args<{}>({}));
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('suppresses logging when logger is false', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const handler = compose(
      eventType<{}>(),
      catchErrors({
        logger: false,
        onError: () => undefined as unknown as void,
      }),
    )(async () => {
      throw new Error('boom');
    });

    await handler(...args<{}>({}));
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('resolves the logger from context.deps.logger by default', async () => {
    const logError = jest.fn();
    const handler = compose(
      eventType<{}>(),
      inject({
        logger: () => ({ error: logError }),
      }),
      catchErrors({
        onError: () => undefined as unknown as void,
      }),
    )(async () => {
      throw new Error('boom');
    });

    await handler(...args<{}>({}));
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it('prefers context.deps.logger over options.logger', async () => {
    const depsLogger = jest.fn();
    const optionsLogger = jest.fn();
    const handler = compose(
      eventType<{}>(),
      inject({
        logger: () => ({ error: depsLogger }),
      }),
      catchErrors({
        logger: { error: optionsLogger },
        onError: () => undefined as unknown as void,
      }),
    )(async () => {
      throw new Error('boom');
    });

    await handler(...args<{}>({}));
    expect(depsLogger).toHaveBeenCalledTimes(1);
    expect(optionsLogger).not.toHaveBeenCalled();
  });

  it('awaits async onError', async () => {
    const handler = compose(
      eventType<{}>(),
      catchErrors({
        logger: false,
        onError: () =>
          new Promise<string>((resolve) => setTimeout(() => resolve('async-handled'), 1)),
      }),
    )(async () => {
      throw new Error('boom');
    });

    await expect(handler(...args<{}>({}))).resolves.toBe('async-handled');
  });
});
