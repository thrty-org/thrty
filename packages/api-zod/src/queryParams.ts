import type { QueryParams, QueryParamsMeta } from '@thrty/api';
import type { Middleware } from '@thrty/core';
import { validate } from '@thrty/validator';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { type TypeOf, ZodError, type ZodIssue, type ZodType } from 'zod';
import { ZodBadRequestError } from './ZodBadRequestError';

export interface QueryParamsOptions {
  /**
   * Factory function to create a custom error when the query params is invalid
   * @default BadRequestError
   */
  badRequestErrorFactory?: (error: ZodError) => Error;
}

const optionsDefaults = {
  badRequestErrorFactory: (error: ZodError) =>
    new ZodBadRequestError('Invalid query params', error.issues),
} satisfies QueryParamsOptions;

/**
 * Middleware to parse and validate the query string parameters using a Zod schema
 * @param params - Zod schema to validate the query string parameters
 * @param options { QueryParamsOptions }
 */
export const queryParams = <
  TEvent extends APIGatewayProxyEvent,
  C,
  R,
  const TParams extends ZodType,
>(
  params: TParams,
  options?: QueryParamsOptions,
): Middleware<TEvent, OutputEvent<TEvent, TParams>, Promise<R>, Promise<R>, C, C> => {
  const { badRequestErrorFactory } = { ...optionsDefaults, ...options };
  const inner = validate<TEvent, TParams, C, R, 'queryParams'>({
    schema: params,
    select: (event) => ({
      ...event.queryStringParameters,
      ...event.multiValueQueryStringParameters,
    }),
    path: 'queryParams',
    onInvalid: (issues) => badRequestErrorFactory(new ZodError(issues as ZodIssue[])),
  }) as Middleware<TEvent, OutputEvent<TEvent, TParams>, Promise<R>, Promise<R>, C, C>;
  return Object.assign(inner, {
    meta: {
      queryParams: params,
    } satisfies QueryParamsMeta,
  });
};

type OutputEvent<TInputEvent, TParams extends ZodType> = TInputEvent & QueryParams<TypeOf<TParams>>;
