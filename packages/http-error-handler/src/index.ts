import { Middleware } from '@thrty/core';
import { catchErrors } from '@thrty/error-handler';
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

export interface CatchHttpErrorsOptions {
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

type ResolvedCatchHttpErrorsOptions = Required<
  Pick<CatchHttpErrorsOptions, 'blacklist' | 'safeBaseError'>
>;

type CatchHttpErrorsRequiredEvents = {
  path: string;
  httpMethod: string;
};

export const catchHttpErrors = <T extends CatchHttpErrorsRequiredEvents, C, R>(
  options: CatchHttpErrorsOptions = {},
): Middleware<T, T, Promise<R>, Promise<R>, C, C> => {
  const resolvedOptions = { ...defaultOptions, ...options };
  return catchErrors<T, C, R>({
    logger: options.logger,
    onError: (error) => {
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
    },
  });
};

export const getSafeResponse = (options: ResolvedCatchHttpErrorsOptions, error?: any) => {
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

const defaultOptions: ResolvedCatchHttpErrorsOptions = {
  blacklist: [internalServerError, forbiddenError, unauthorizedError, unknownError],
  safeBaseError: BaseError,
};
