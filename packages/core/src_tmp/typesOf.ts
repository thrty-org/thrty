import { Middleware } from './Middleware';

export type Handler<TEvent = any, TResult = any> = (
  event: TEvent,
  context: any,
  callback: any,
) => void | Promise<TResult>;

export const typesOf =
  <
    THandler extends Handler,
    TEvent = Parameters<THandler>[0],
    TReturnValue = Exclude<ReturnType<THandler>, void>,
  >(): Middleware<TEvent, TEvent, TReturnValue, TReturnValue> =>
  (next: any) =>
  (...args: any[]) =>
    next(...args);
