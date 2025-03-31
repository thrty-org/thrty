import { compose, typesOf } from '@thrty/core';
import { fromPartial } from '@thrty/testing';
import { z } from 'zod';
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { responseBody } from './responseBody';
import { ZodBadRequestError } from './requestBody';

describe('given type of response body is invalid', () => {
  describe('and validate is false (default)', () => {
    const handler = compose(
      typesOf<APIGatewayProxyHandler>(),
      responseBody(z.object({ id: z.string() })),
    )(async (event) => {
      return {
        statusCode: 200,
        body: {
          name: 'Marty',
        } as any,
      };
    });

    let result: Awaited<ReturnType<typeof handler>>;
    beforeEach(async () => {
      result = await handler(fromPartial<APIGatewayProxyEvent>({}));
    });

    it('should expect error', () => {
      compose(
        typesOf<APIGatewayProxyHandler>(),
        responseBody(z.object({ id: z.string() })),
        // @ts-expect-error - Throws due to invalid response body type
      )(async (event) => {
        return {
          statusCode: 200,
          body: {
            name: 'Marty',
          },
        };
      });
    });

    it('should return serialized response anyway', () => {
      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          name: 'Marty',
        }),
      });
    });
  });
  describe('and validate is true', () => {
    const handler = compose(
      typesOf<APIGatewayProxyHandler>(),
      responseBody(z.object({ id: z.string() }), { validate: true }),
    )(async (event) => {
      return {
        statusCode: 200,
        body: {
          name: 'Marty',
        } as any,
      };
    });

    let result: Awaited<ReturnType<typeof handler>> | Error;
    beforeEach(async () => {
      result = await handler(fromPartial<APIGatewayProxyEvent>({})).catch((e) => e);
    });

    it('should return error', () => {
      expect(result).toBeInstanceOf(Error);
      expect(result).toHaveProperty('message', 'Invalid response body');
      expect(result).toHaveProperty('issues', [
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Required',
          path: ['id'],
          received: 'undefined',
        },
      ]);
    });
  });
});

describe('given response body is valid', () => {
  const handler = compose(
    typesOf<APIGatewayProxyHandler>(),
    responseBody(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        birthDate: z.string().date(),
      }),
    ),
  )(async (event) => {
    return {
      statusCode: 200,
      body: {
        firstName: 'Marty',
        lastName: 'McFly',
        birthDate: '1968-06-12',
      },
    };
  });

  let result: Awaited<ReturnType<typeof handler>>;
  beforeEach(async () => {
    result = await handler(fromPartial<APIGatewayProxyEvent>({}));
  });

  it('should return serialized response', () => {
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        firstName: 'Marty',
        lastName: 'McFly',
        birthDate: '1968-06-12',
      }),
    });
  });
});
