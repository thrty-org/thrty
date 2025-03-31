import type { RequestBody, RequestBodyMeta } from '@thrty/api';
import type { Middleware } from '@thrty/core';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { TypeOf, ZodError, ZodIssue, ZodType } from 'zod';
import { BadRequestError } from '@thrty/http-errors';

export interface RequestBodyOptions {
  /**
   * Factory function to create a custom error when the request body is invalid
   * @default BadRequestError
   */
  badRequestErrorFactory?: (error: ZodError) => Error;
}

const optionsDefaults = {
  badRequestErrorFactory: (error: ZodError) =>
    new ZodBadRequestError('Invalid request body', error.issues),
} satisfies RequestBodyOptions;

/**
 * Middleware to parse and validate the request body using a Zod schema
 * @param body - Zod schema to validate the request body
 * @param options { RequestBodyOptions }
 */
export const requestBody = <TEvent extends APIGatewayProxyEvent, R, const TBody extends ZodType>(
  body: TBody,
  options?: RequestBodyOptions,
): Middleware<TEvent, OutputEvent<TEvent, TBody>, Promise<R>, Promise<R>> => {
  const { badRequestErrorFactory } = { ...optionsDefaults, ...options };
  return Object.assign(
    (next: any) =>
      async (event: TEvent, ...rest: any[]): Promise<any> => {
        const isJsonString = (body: string | null): body is string =>
          typeof body === 'string' && ['{', '[', '"'].includes(body[0]);
        const parsedBody = isJsonString(event.body) ? JSON.parse(event.body) : event.body;
        const res = await body.safeParseAsync(parsedBody);
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

export class ZodBadRequestError extends BadRequestError {
  issues: ZodIssue[];
  constructor(message: string, issues: ZodIssue[]) {
    super(message);
    this.issues = issues;
  }
}
