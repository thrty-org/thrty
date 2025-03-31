import { compose, types, typesOf } from '@thrty/core';
import { fromPartial } from '@thrty/testing';
import { z } from 'zod';
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { requestBody } from './requestBody';
import { ZodBadRequestError } from './ZodBadRequestError';

const handler = compose(
  typesOf<APIGatewayProxyHandler>(),
  requestBody(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      birthDate: z.string().date(),
    }),
  ),
)(async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      firstName: event.requestBody.firstName,
      lastName: event.requestBody.lastName,
      birthDate: event.requestBody.birthDate,
    }),
  };
});

describe('given an unknown property is tried to be accessed', () => {
  it('should expect error', () => {
    compose(
      types<APIGatewayProxyEvent, Promise<void>>(),
      requestBody(
        z.object({
          id: z.string(),
        }),
      ),
    )(async (event) => {
      // @ts-expect-error - Throws due to unknown property
      event.requestBody.additionalProp;
    });
  });
});

describe('given request body is missing', () => {
  let result: Awaited<ReturnType<typeof handler>> | Error;
  beforeEach(async () => {
    result = await handler(fromPartial<APIGatewayProxyEvent>({})).catch((err: Error) => err);
  });

  it('should return an error', () => {
    expect(result).toBeInstanceOf(ZodBadRequestError);
    expect(result).toHaveProperty('message', 'Invalid request body');
    expect(result).toHaveProperty('issues', [
      {
        code: 'invalid_type',
        expected: 'object',
        message: 'Required',
        path: [],
        received: 'undefined',
      },
    ]);
  });
});

describe('given props are missing on request body', () => {
  let result: Awaited<ReturnType<typeof handler>> | Error;
  beforeEach(async () => {
    result = await handler(
      fromPartial<APIGatewayProxyEvent>({
        body: JSON.stringify({
          firstName: 'Marty',
          lastName: 'McFly',
        }),
      }),
    ).catch((err: Error) => err);
  });

  it('should return an error', () => {
    expect(result).toBeInstanceOf(ZodBadRequestError);
    expect(result).toHaveProperty('message', 'Invalid request body');
    expect(result).toHaveProperty('issues', [
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Required',
        path: ['birthDate'],
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
        body: JSON.stringify({
          firstName: 'Marty',
          lastName: 'McFly',
          birthDate: '1968-06-12',
          address: '9303 Roslyndale Avenue, Pacoima, California',
        }),
      }),
    );
  });

  it('should return input without additional prop', () => {
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
