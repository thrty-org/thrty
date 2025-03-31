import type { QueryParams, QueryParamsMeta } from '@thrty/api';
import type { Middleware } from '@thrty/core';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { TypeOf, ZodError, ZodType } from 'zod';
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
export const queryParams = <TEvent extends APIGatewayProxyEvent, R, const TParams extends ZodType>(
  params: TParams,
  options?: QueryParamsOptions,
): Middleware<TEvent, OutputEvent<TEvent, TParams>, Promise<R>, Promise<R>> => {
  const { badRequestErrorFactory } = { ...optionsDefaults, ...options };
  return Object.assign(
    (next: any) =>
      async (event: TEvent, ...rest: any[]): Promise<any> => {
        const res = await params.safeParseAsync({
          ...event.queryStringParameters,
          ...event.multiValueQueryStringParameters,
        });
        if (res.success) {
          return next(
            Object.assign(event, { queryParams: res.data } satisfies QueryParams),
            ...rest,
          );
        }
        throw badRequestErrorFactory(res.error);
      },
    {
      meta: {
        queryParams: params,
      } satisfies QueryParamsMeta,
    },
  );
};

type OutputEvent<TInputEvent, TParams extends ZodType> = TInputEvent & QueryParams<TypeOf<TParams>>;
