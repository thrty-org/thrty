import { Middleware, TypeRef } from '@thrty/core';

export interface ParseRequestBodyRequiredEvent {
  body: string | null;
}
export const parseRequestBody =
  <T extends ParseRequestBodyRequiredEvent, C, R, TBody = object>(
    bodyType?: TypeRef<TBody>,
  ): Middleware<T, T & { jsonBody: TBody }, R, R, C, C> =>
  (handler) =>
  (event, ...args) =>
    handler(Object.assign(event, { jsonBody: event.body ? JSON.parse(event.body) : {} }), ...args);
