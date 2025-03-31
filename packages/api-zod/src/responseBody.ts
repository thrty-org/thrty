import type { APIGatewayProxyResult } from 'aws-lambda';
import type { Middleware } from '@thrty/core';
import type { ResponseBody, ResponseBodyMeta } from '@thrty/api';
import type { TypeOf, ZodType } from 'zod';

export type OutputResult<TResult, TBody extends ZodType> = Omit<TResult, 'body'> &
  ResponseBody<TypeOf<TBody>>;
export interface ResponseBodyOptions {
  /**
   * If true, the body will be validated against the schema
   * @default false
   */
  validate?: boolean;
}

/**
 * Middleware to validate and serialize the response body using a Zod schema
 * @param body - Zod schema to validate the response body
 * @param validate - If true, the body will be validated against the schema. Default is false.
 */
export const responseBody = <TEvent, R extends APIGatewayProxyResult, const TBody extends ZodType>(
  body: TBody,
  { validate }: ResponseBodyOptions = {},
): Middleware<TEvent, TEvent, Promise<R>, Promise<OutputResult<R, TBody>>> =>
  Object.assign(
    (next: any) =>
      async (...args: any[]) => {
        const { body: bodyResult, ...rest } = await next(...args);

        if (validate) {
          const res = await body.safeParseAsync(bodyResult);
          if (!res.success) {
            throw Object.assign(new Error('Invalid response body'), { issues: res.error.issues });
          }
        }
        return {
          ...rest,
          body:
            bodyResult && typeof bodyResult === 'object' ? JSON.stringify(bodyResult) : bodyResult,
        };
      },
    {
      meta: {
        responseBody: body,
      } satisfies ResponseBodyMeta,
    },
  );
