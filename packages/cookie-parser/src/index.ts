import { parse, ParseOptions } from 'cookie';
import { APIGatewayRequestAuthorizerEventHeaders } from 'aws-lambda';
import { Middleware } from '@thrty/core';

export interface ParseCookieRequiredEvent {
  headers: APIGatewayRequestAuthorizerEventHeaders | null;
}
export const parseCookie =
  <T extends ParseCookieRequiredEvent, R>(
    options?: ParseOptions,
  ): Middleware<T, T & { cookie: object }, R, R> =>
  (next) =>
  (event: T, ...args) =>
    next(
      Object.assign(event, {
        cookie: event.headers?.Cookie ? parse(event.headers.Cookie, options) : {},
      }),
      ...args,
    );
