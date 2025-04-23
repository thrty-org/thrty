import type { Middleware } from '@thrty/core';

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
type RequiredEvent = {
  deps?: { logger?: { info(...args: any[]): any } };
};
export const retry = <T extends RequiredEvent, R>(
  options: RetryOptions = {},
): Middleware<T, T, Promise<R>, Promise<R>> => {
  const { maxRetries = 3, delay = 0, logger = console } = options;
  const retryOn =
    typeof options.retryOn === 'function'
      ? options.retryOn
      : Array.isArray(options.retryOn)
        ? (error: unknown) =>
            (options.retryOn as Array<ErrorConstructor>).some((e) => error instanceof e)
        : () => true;

  return (next) =>
    async (event: T, ...args): Promise<R> => {
      const log =
        logger === false
          ? () => {}
          : (event.deps?.logger?.info.bind(event.deps?.logger) ?? logger.info.bind(logger));
      let retries = 0;
      let error: Error | unknown = new Error('Unknown error');
      do {
        if (retries) log(`Retrying ${retries}. time`);
        try {
          return await next(event, ...args);
        } catch (e) {
          if (delay) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
          error = e;
        }
        retries++;
      } while (retries <= maxRetries && retryOn(error));
      throw error;
    };
};
