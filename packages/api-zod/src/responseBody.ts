import { APIGatewayProxyResult } from 'aws-lambda';
import { Middleware } from '@thrty/core';
import { ResponseBody, ResponseBodyMeta } from '@thrty/api';
import { TypeOf, ZodType } from 'zod';

export type OutputResult<TResult, TBody extends ZodType> = Omit<TResult, 'body'> &
  ResponseBody<TypeOf<TBody>>;
export interface ResponseBodyOptions {
  /**
   * If true, the body will be validated against the schema
   * @default false
   */
  validate?: boolean;
}
export const responseBody = <TEvent, R extends APIGatewayProxyResult, const TBody extends ZodType>(
  _body: TBody,
  { validate }: ResponseBodyOptions = {},
): Middleware<TEvent, TEvent, Promise<R>, Promise<OutputResult<R, TBody>>> =>
  Object.assign(
    (next: any) =>
      async (...args: any[]) => {
        const { body, ...rest } = await next(...args);

        if (validate) {
          const { success } = _body.safeParse(body);
          if (!success) {
            throw new Error('Invalid response body');
          }
        }
        return {
          ...rest,
          body: body && typeof body === 'object' ? JSON.stringify(body) : body,
        };
      },
    {
      meta: {
        responseBody: _body,
      } satisfies ResponseBodyMeta,
    },
  );
