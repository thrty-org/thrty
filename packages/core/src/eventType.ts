import { Middleware } from './Middleware';

export const eventType =
  <InitialType, ReturnType = Promise<any>>(): Middleware<
    InitialType,
    InitialType,
    ReturnType,
    ReturnType
  > =>
  (handler) =>
  (...args) =>
    handler(...args);
