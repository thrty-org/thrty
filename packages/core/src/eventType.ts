import type { Context as LambdaContext } from 'aws-lambda';
import { Middleware } from './Middleware';

export const eventType =
  <InitialType, ReturnType = Promise<any>, TContext = LambdaContext>(): Middleware<
    InitialType,
    InitialType,
    ReturnType,
    ReturnType,
    TContext,
    TContext
  > =>
  (handler) =>
  (...args) =>
    handler(...args);
