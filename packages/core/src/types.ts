import type { Context as LambdaContext } from 'aws-lambda';
import { Middleware } from './Middleware';

export const types =
  <TEvent, TReturnValue, TContext = LambdaContext>(): Middleware<
    TEvent,
    TEvent,
    TReturnValue,
    TReturnValue,
    TContext,
    TContext
  > =>
  (next: any) =>
  (...args: any[]) =>
    next(...args);
