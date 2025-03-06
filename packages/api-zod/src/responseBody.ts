import { Middleware } from 'thirty/core';
import { APIGatewayProxyResult } from 'thirty/types';
import { InternalServerError } from 'thirty/errors';
import { TypeOf, ZodType } from 'zod';

export type OutputResult<TResult, TBody extends ZodType> = Omit<TResult, 'body'> & {
  body: TypeOf<TBody>;
};
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
            throw new InternalServerError('Invalid response body');
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
      },
    } as any,
  );
