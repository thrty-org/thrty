import { Context } from 'aws-lambda';
import { Middleware } from '@thrty/core/src';

export const doNotWaitForEmptyEventLoop =
  <T, R>(): Middleware<T, T, R, R> =>
  (next) =>
  (event, context: Context, ...args) => {
    context.callbackWaitsForEmptyEventLoop = false;
    return next(event, context, ...args);
  };
