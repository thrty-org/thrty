import { APIGatewayProxyEvent } from 'aws-lambda';
import { Middleware } from '@thrty/core';

export interface AuthorizerMeta {
  authorizerName?: string;
}
export const authorizer = <TEvent extends APIGatewayProxyEvent, C, R>(
  authorizerName: string,
): Middleware<TEvent, TEvent, R, R, C, C> =>
  Object.assign((next: any) => next, {
    meta: {
      authorizerName,
    } satisfies AuthorizerMeta,
  });
