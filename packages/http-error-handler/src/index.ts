import { Middleware } from '@thrty/core';
import { BaseError } from '@thrty/http-errors';
import { APIGatewayProxyResult } from 'aws-lambda';

export type BlacklistItem = {
  alternativeMessage: string;
  statusCode: number | undefined;
  alternativeStatusCode?: number;
};

interface ErrorLogger {
  error(...args: any[]): any;
  [log: string]: any;
}

export interface HttpErrorHandlerOptions {
  /**
   * Logger to use for logging errors.
   * If not provided, console will be used.
   * If set to false, no logging will be done.
   * @default console
   */
  logger?: ErrorLogger | false;
  /**
   * List of errors with status codes, where error message should be obfuscated
   * @default [
   *  { message: 'Internal Server Error', statusCode: 500 },
   *  { message: 'Forbidden', statusCode: 403 },
   *  { message: 'Unauthorized', statusCode: 401 },
   *  { message: 'InternalServerError', statusCode: undefined },
   *  ]
   */
  blacklist?: BlacklistItem[];
  safeBaseError?: any;
}

type ResolvedHttpErrorHandlerOptions = Required<
  Pick<HttpErrorHandlerOptions, 'blacklist' | 'safeBaseError'>
>;

type HttpErrorHandlerRequiredEvents = {
  path: string;
  httpMethod: string;
  deps?: { logger?: ErrorLogger };
};

export const httpErrorHandler =
  <T extends HttpErrorHandlerRequiredEvents, R>(
    options: HttpErrorHandlerOptions = {},
  ): Middleware<T, T, Promise<R>, Promise<R>> =>
  (handler) =>
  async (event, ...args) =>
    handler(event, ...args).catch((error) => {
      const resolvedOptions = { ...defaultOptions, ...options };
      const logger =
        options.logger === false ? noOpLogger : (event.deps?.logger ?? options.logger ?? console);
      logger.error(error);

      const { statusCode, message, ...errorProps } = getSafeResponse(resolvedOptions, error);
      return {
        statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          ...errorProps,
        }),
      } satisfies APIGatewayProxyResult as unknown as R;
    });

export const getSafeResponse = (options: ResolvedHttpErrorHandlerOptions, error?: any) => {
  const isSafeErrorInstance = error instanceof options.safeBaseError;
  if (!isSafeErrorInstance) {
    return {
      message: internalServerError.alternativeMessage,
      statusCode: internalServerError.statusCode,
    };
  }
  const blacklistItem = options.blacklist.find(
    ({ statusCode }) => error?.statusCode === statusCode,
  );
  if (blacklistItem) {
    return {
      message: blacklistItem.alternativeMessage,
      statusCode: blacklistItem.alternativeStatusCode ?? blacklistItem.statusCode,
    };
  }
  return error;
};

const unknownError = {
  statusCode: undefined,
  alternativeMessage: 'InternalServerError',
  alternativeStatusCode: 500,
};
const internalServerError = { statusCode: 500, alternativeMessage: 'InternalServerError' };
const forbiddenError = { statusCode: 403, alternativeMessage: 'Forbidden' };
const unauthorizedError = { statusCode: 401, alternativeMessage: 'Unauthorized' };

const defaultOptions: ResolvedHttpErrorHandlerOptions = {
  blacklist: [internalServerError, forbiddenError, unauthorizedError, unknownError],
  safeBaseError: BaseError,
};

const noOpLogger = { error: () => null };
