import { Middleware, TypeRef } from '@thrty/core';

export interface ParseJsonRequiredEvent {
  body: string | null;
}
export const parseJson =
  <T extends ParseJsonRequiredEvent, C, R, TBody = object>(
    bodyType?: TypeRef<TBody>,
  ): Middleware<T, T & { jsonBody: TBody }, R, R, C, C> =>
  (handler) =>
  (event, ...args) =>
    handler(Object.assign(event, { jsonBody: event.body ? JSON.parse(event.body) : {} }), ...args);
