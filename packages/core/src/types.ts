import { Middleware } from '../src_tmp/Middleware';

export const types =
  <TEvent, TReturnValue>(): Middleware<TEvent, TEvent, TReturnValue, TReturnValue> =>
  (next: any) =>
  (...args: any[]) =>
    next(...args);
