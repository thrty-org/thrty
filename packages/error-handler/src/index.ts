import type { Middleware } from '@thrty/core';

export interface ErrorLogger {
  error(...args: any[]): any;
  [log: string]: any;
}

export interface CatchErrorsOptions<TEvent, TContext, TResult> {
  /**
   * Called for every caught error, after logging. Return
   * `Promise.reject(...)` to propagate (the original or a mapped error);
   * return a value to substitute it as the lambda's result.
   *
   * When omitted, the original error is rethrown. This is the safe default
   * for event-triggered lambdas (SQS, EventBridge, S3, ...) whose retry /
   * DLQ behavior depends on the invocation failing.
   */
  onError?: (
    error: unknown,
    ctx: { event: TEvent; context: TContext },
  ) => TResult | Promise<TResult>;
  /**
   * Logger to use for caught errors. Falls back to `context.deps.logger` if
   * present, otherwise `console`. Pass `false` to suppress logging entirely.
   * @default context.deps.logger ?? console
   */
  logger?: ErrorLogger | false;
}

/**
 * Catches any error thrown by middlewares registered *after* it in the
 * compose chain. By default, logs the error and rethrows so retry / DLQ
 * semantics are preserved. Provide `onError` to map the error or substitute
 * a result (e.g. an HTTP response).
 */
export const catchErrors =
  <TEvent, TContext, TResult>(
    options: CatchErrorsOptions<TEvent, TContext, TResult> = {},
  ): Middleware<TEvent, TEvent, Promise<TResult>, Promise<TResult>, TContext, TContext> =>
  (handler) =>
  async (event, context, ...rest: any[]) => {
    try {
      return await (handler as any)(event, context, ...rest);
    } catch (error) {
      if (options.logger !== false) {
        const contextDeps = (context as { deps?: { logger?: ErrorLogger } } | undefined)?.deps;
        const logger = contextDeps?.logger ?? options.logger ?? console;
        logger.error(error);
      }
      if (!options.onError) return Promise.reject(error);
      return await options.onError(error, { event, context });
    }
  };
