import { compose } from '@thrty/core';
import { types } from 'thirty/core';
import { APIGatewayProxyResult } from 'thirty/types';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { get, post, patch, trace, put, $delete, head } from './endpoint';

describe.each([['get', get] as const])('$1', (method, request) => {
  // @ts-expect-error - Would throw if path do not start with '/'
  request('user');

  const handler = compose(
    types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
    request('/users/{userId}'),
  )(async (event) => {
    event.routeParams.userId;

    // @ts-expect-error - Would throw if path parameter is not defined
    event.routeParams.unknown;

    return {
      statusCode: 200,
      body: `Hello, ${event.pathParameters?.test}`,
    };
  });

  describe('path without parameter', () => {
    it('should set meta data for middleware', () => {
      expect(handler.meta).toEqual({
        endpoint: {
          method,
          path: '/users/{userId}',
        },
      });
    });

    it('should pass data properly', () => {
      expect(handler({ pathParameters: { test: 'world' } } as any)).resolves.toEqual({
        statusCode: 200,
        body: 'Hello, world',
      });
    });
  });

  describe('path with parameter', () => {
    const handler = compose(
      types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
      request('/users/{userId}'),
    )(async (event) => {
      return {
        statusCode: 200,
        body: `Hello, ${event.pathParameters?.test}`,
      };
    });
  });

  describe('path with multiple parameters', () => {
    const handler = compose(
      types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
      request('/users/{userId}/friends/{friendId}'),
    )(async (event) => {
      return {
        statusCode: 200,
        body: `Hello, ${event.pathParameters?.test}`,
      };
    });
  });
});
