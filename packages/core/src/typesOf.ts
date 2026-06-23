import type { Context as LambdaContext } from 'aws-lambda';
import { Middleware } from './Middleware';

export type Handler<TEvent = any, TContext = LambdaContext, TResult = any> = (
  event: TEvent,
  context: TContext,
  callback: any,
) => void | Promise<TResult>;

export const typesOf =
  <
    THandler extends Handler,
    TEvent = Parameters<THandler>[0],
    TReturnValue = Exclude<ReturnType<THandler>, void>,
    TContext = Parameters<THandler>[1],
  >(): Middleware<TEvent, TEvent, TReturnValue, TReturnValue, TContext, TContext> =>
  (next: any) =>
  (...args: any[]) =>
    next(...args);
