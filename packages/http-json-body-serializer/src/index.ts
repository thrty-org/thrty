import { APIGatewayProxyResult } from 'aws-lambda';
import { Middleware, TypeRef } from '@thrty/core';

export type SerializeJsonOptions<TBody = object> = Omit<APIGatewayProxyResult, 'body'> & {
  body?: TBody;
};
export const serializeJson =
  <E, R1 extends APIGatewayProxyResult, R2 extends SerializeJsonOptions<TBody>, TBody>(
    bodyType?: TypeRef<TBody>,
  ): Middleware<E, E, Promise<R1>, Promise<R2>> =>
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
