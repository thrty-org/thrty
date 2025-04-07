import { compose, types, typesOf } from '@thrty/core';
import { fromPartial } from '@thrty/testing';
import { z } from 'zod';
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { queryParams } from './queryParams';
import { ZodBadRequestError } from './ZodBadRequestError';

const handler = compose(
  typesOf<APIGatewayProxyHandler>(),
  queryParams(
    z.object({
      limit: z.string().transform(Number),
      page: z.string().transform(Number),
      sortBy: z.array(z.string()),
    }),
  ),
)(async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      limit: event.queryParams.limit,
      page: event.queryParams.page,
      sortBy: event.queryParams.sortBy,
    }),
  };
});

describe('given an unknown property is tried to be accessed', () => {
  it('should expect error', () => {
    compose(
      types<APIGatewayProxyEvent, Promise<void>>(),
      queryParams(
        z.object({
          id: z.string(),
        }),
      ),
    )(async (event) => {
      // @ts-expect-error - Throws due to unknown property
      event.queryParams.additionalProp;
    });
  });
});

describe('given props are missing in query params', () => {
  let result: Awaited<ReturnType<typeof handler>> | Error;
  beforeEach(async () => {
    result = await handler(
      fromPartial<APIGatewayProxyEvent>({
        queryStringParameters: {
          limit: '100',
          page: '2',
        },
      }),
    ).catch((err: Error) => err);
  });

  it('should return an error', () => {
    expect(result).toBeInstanceOf(ZodBadRequestError);
    expect(result).toHaveProperty('message', 'Invalid query params');
    expect(result).toHaveProperty('issues', [
      {
        code: 'invalid_type',
        expected: 'array',
        message: 'Required',
        path: ['sortBy'],
        received: 'undefined',
      },
    ]);
  });
});

describe('given additional props are provided', () => {
  let result: Awaited<ReturnType<typeof handler>>;
  beforeEach(async () => {
    result = await handler(
      fromPartial<APIGatewayProxyEvent>({
        queryStringParameters: {
          limit: '100',
          page: '2',
          additionalProp: 'additionalProp',
        },
        multiValueQueryStringParameters: {
          sortBy: ['name', 'age'],
        },
      }),
    );
  });

  it('should return input without additional prop', () => {
    expect(result).toStrictEqual({
      statusCode: 200,
      body: JSON.stringify({
        limit: 100,
        page: 2,
        sortBy: ['name', 'age'],
      }),
    });
  });
});
