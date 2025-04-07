import type {
  APIGatewayProxyEventHeaders,
  APIGatewayRequestAuthorizerEventHeaders,
} from 'aws-lambda';
import type { Middleware } from '@thrty/core';

export interface NormalizedHeadersEvent {
  headers: APIGatewayProxyEventHeaders;
}

export const normalizeHeaders =
  <T extends InputEvent, R>(): Middleware<T, OutputEvent<T>, R, R> =>
  (handler) =>
  (event, ...args) =>
    handler(
      Object.assign(event, { headers: event.headers ? normalize(event.headers) : {} }),
      ...args,
    );

export const normalize = (headers: APIGatewayRequestAuthorizerEventHeaders) => {
  return Object.keys(headers ?? {}).reduce(
    (normalizedHeaders, headerName) => ({
      ...normalizedHeaders,
      [headerName.toLowerCase()]: headers?.[headerName] ?? undefined,
    }),
    {} as NormalizedHeadersEvent['headers'],
  );
};

export interface InputEvent {
  headers: APIGatewayProxyEventHeaders | null;
}
export type OutputEvent<T extends InputEvent> = Omit<T, 'headers'> & NormalizedHeadersEvent;
