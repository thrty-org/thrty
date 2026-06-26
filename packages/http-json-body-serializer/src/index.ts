import { APIGatewayProxyResult } from 'aws-lambda';
import { Middleware, TypeRef } from '@thrty/core';

export type SerializeResponseBodyOptions<TBody = object> = Omit<APIGatewayProxyResult, 'body'> & {
  body?: TBody;
};
export const serializeResponseBody =
  <E, C, R1 extends APIGatewayProxyResult, R2 extends SerializeResponseBodyOptions<TBody>, TBody>(
    bodyType?: TypeRef<TBody>,
  ): Middleware<E, E, Promise<R1>, Promise<R2>, C, C> =>
  (next) =>
  async (...args) => {
    const { body, ...rest } = await next(...args);
    return {
      ...rest,
      headers: {
        ...rest.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    } satisfies APIGatewayProxyResult as unknown as R1;
  };
