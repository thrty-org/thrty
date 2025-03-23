import { RequestBody, RequestBodyMeta } from '@thrty/api';
import { Middleware } from '@thrty/core';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { TypeOf, ZodError, ZodType } from 'zod';

export interface RequestBodyOptions {
  /**
   * Factory function to create a custom error when the request body is invalid
   * @default BadRequestError
   */
  badRequestErrorFactory?: (error: ZodError) => Error;
}

const optionsDefaults = {
  badRequestErrorFactory: (error: ZodError) =>
    new BadRequestError(error.issues.map((e) => e.message).join(', ')),
} satisfies RequestBodyOptions;

/**
 * Middleware to parse and validate the request body using a Zod schema
 * @param body
 * @param options
 */
export const requestBody = <TEvent extends APIGatewayProxyEvent, R, const TBody extends ZodType>(
  body: TBody,
  options?: RequestBodyOptions,
): Middleware<TEvent, OutputEvent<TEvent, TBody>, R, R> => {
  const { badRequestErrorFactory } = { ...optionsDefaults, ...options };
  return Object.assign(
    (next: any) =>
      (event: TEvent, ...rest: any[]) => {
        const parsedBody = event.body?.startsWith('{') ? JSON.parse(event.body) : event.body;
        const res = body.safeParse(parsedBody);
        if (res.success) {
          return next(
            Object.assign(event, { requestBody: res.data } satisfies RequestBody),
            ...rest,
          );
        }
        throw badRequestErrorFactory(res.error);
      },
    {
      meta: {
        requestBody: body,
      } satisfies RequestBodyMeta,
    },
  );
};

type OutputEvent<TInputEvent, TBody extends ZodType> = TInputEvent & RequestBody<TypeOf<TBody>>;

export class BadRequestError extends Error {}
