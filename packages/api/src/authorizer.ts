import { APIGatewayProxyEvent } from 'aws-lambda';
import { Middleware } from '@thrty/core';

export interface AuthorizerMeta {
  authorizerName?: string;
}
export const authorizer = <TEvent extends APIGatewayProxyEvent, R>(
  authorizerName: string,
): Middleware<TEvent, TEvent, R, R> =>
  Object.assign(
    (next: any) =>
      (...args: any[]) =>
        next(...args),
    {
      meta: {
        authorizerName,
      } satisfies AuthorizerMeta,
    },
  );
