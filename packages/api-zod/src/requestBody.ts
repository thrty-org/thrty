import type { RequestBody, RequestBodyMeta } from '@thrty/api';
import type { Middleware } from '@thrty/core';
import { validate } from '@thrty/validator';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { type TypeOf, ZodError, type ZodIssue, type ZodType } from 'zod';
import { ZodBadRequestError } from './ZodBadRequestError';

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

const isJsonString = (body: string | null): body is string =>
  typeof body === 'string' && ['{', '[', '"'].includes(body[0]);

/**
 * Middleware to parse and validate the request body using a Zod schema
 * @param body - Zod schema to validate the request body
 * @param options { RequestBodyOptions }
 */
export const requestBody = <
  TEvent extends APIGatewayProxyEvent,
  C,
  R,
  const TBody extends ZodType,
>(
  body: TBody,
  options?: RequestBodyOptions,
): Middleware<TEvent, OutputEvent<TEvent, TBody>, Promise<R>, Promise<R>, C, C> => {
  const { badRequestErrorFactory } = { ...optionsDefaults, ...options };
  const inner = validate<TEvent, TBody, C, R, 'requestBody'>({
    schema: body,
    select: (event) => (isJsonString(event.body) ? JSON.parse(event.body) : event.body),
    path: 'requestBody',
    onInvalid: (issues) => badRequestErrorFactory(new ZodError(issues as ZodIssue[])),
  }) as Middleware<TEvent, OutputEvent<TEvent, TBody>, Promise<R>, Promise<R>, C, C>;
  return Object.assign(inner, {
    meta: {
      requestBody: body,
    } satisfies RequestBodyMeta,
  });
};

type OutputEvent<TInputEvent, TBody extends ZodType> = TInputEvent & RequestBody<TypeOf<TBody>>;
