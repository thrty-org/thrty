import { compose, typesOf } from '@thrty/core';
import { fromPartial } from '@thrty/testing';
import { NotFoundError } from '@thrty/http-errors';
import { httpErrorHandler } from '@thrty/http-error-handler';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { handleCors } from './index';

let handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

beforeAll(() => {
  handler = compose(
    typesOf<APIGatewayProxyHandler>(),
    handleCors(),
  )(async (event) => {
    return {
      statusCode: 200,
      body: JSON.stringify({}),
      headers: {
        'Set-Cookie': 'session=1234',
      },
    };
  });
});

it('should return preflight headers on OPTIONS request', async () => {
  const response = await handler(fromPartial<APIGatewayProxyEvent>({ httpMethod: 'OPTIONS' }));
  expect(response).toEqual({
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'Access-Control-Allow-Origin': '*',
    },
    statusCode: 200,
  });
});

it('should add handleCors headers on any other request', async () => {
  const response = await handler(fromPartial<APIGatewayProxyEvent>({ httpMethod: 'GET' }));
  expect(response).toEqual({
    headers: {
      'Set-Cookie': 'session=1234',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({}),
    statusCode: 200,
  });
});

describe('with origin=test', () => {
  beforeAll(() => {
    handler = compose(
      typesOf<APIGatewayProxyHandler>(),
      handleCors({ origin: 'test' }),
    )(async (event) => {
      return {
        statusCode: 200,
        body: JSON.stringify({}),
        headers: {
          'Set-Cookie': 'session=1234',
        },
      };
    });
  });

  it('should return Access-Control-Allow-Origin set to "test"', async () => {
    const response = await handler(fromPartial<APIGatewayProxyEvent>({ httpMethod: 'OPTIONS' }));
    expect(response.headers).toEqual(
      expect.objectContaining({
        'Access-Control-Allow-Origin': 'test',
      }),
    );
  });
});

describe('with origin=[test]', () => {
  beforeAll(() => {
    handler = compose(
      typesOf<APIGatewayProxyHandler>(),
      handleCors({ origin: ['test'] }),
    )(async (event) => {
      return {
        statusCode: 200,
        body: JSON.stringify({}),
        headers: {
          'Set-Cookie': 'session=1234',
        },
      };
    });
  });

  it('should return Access-Control-Allow-Origin set to "test" due to request header', async () => {
    const response = await handler(
      fromPartial<APIGatewayProxyEvent>({ httpMethod: 'OPTIONS', headers: { origin: 'test' } }),
    );
    expect(response.headers).toEqual(
      expect.objectContaining({
        'Access-Control-Allow-Origin': 'test',
      }),
    );
  });

  it('should return Access-Control-Allow-Origin set to "null" due to invalid request-origin', async () => {
    const response = await handler(
      fromPartial<APIGatewayProxyEvent>({
        httpMethod: 'OPTIONS',
        headers: { origin: 'invalid' },
      }),
    );
    expect(response.headers).toEqual(
      expect.objectContaining({
        'Access-Control-Allow-Origin': 'null',
      }),
    );
  });
});

describe('preflight', () => {
  beforeAll(() => {
    handler = compose(
      typesOf<APIGatewayProxyHandler>(),
      handleCors({ preflight: false }),
    )(async (event) => {
      return {
        statusCode: 200,
        body: JSON.stringify({}),
        headers: {
          'Set-Cookie': 'session=1234',
        },
      };
    });
  });

  it('should not return preflight headers on OPTIONS request', async () => {
    const response = await handler(fromPartial<APIGatewayProxyEvent>({ httpMethod: 'OPTIONS' }));
    expect(response).toEqual({
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Set-Cookie': 'session=1234',
      },
      body: '{}',
      statusCode: 200,
    });
  });
});

describe('with httpErrorHandler', () => {
  beforeAll(() => {
    handler = compose(
      typesOf<APIGatewayProxyHandler>(),
      handleCors(),
      httpErrorHandler({ logger: false }),
    )(async () => {
      throw new NotFoundError('Not found');
    });
  });

  it('should add access control headers after error appeared', async () => {
    const response = await handler(fromPartial<APIGatewayProxyEvent>({ httpMethod: 'GET' }));
    expect(response).toEqual({
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      statusCode: 404,
      body: JSON.stringify({
        message: 'Not found',
      }),
    });
  });
});
