import { Middleware } from './Middleware';

export const types =
  <TEvent, TReturnValue>(): Middleware<TEvent, TEvent, TReturnValue, TReturnValue> =>
  (next: any) =>
  (...args: any[]) =>
    next(...args);
