import { compose } from '@thrty/core';
import { types } from 'thirty/core';
import { APIGatewayProxyResult } from 'thirty/types';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { get, post, patch, trace, put, $delete, head } from './endpoint';

describe.each([
  ['get', get],
  ['post', post],
  ['patch', patch],
  ['trace', trace],
  ['put', put],
  ['delete', $delete],
  ['head', head],
] as const)('%s', (method, request: typeof get) => {
  const handler = compose(
    types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
    request('/users/{userId}'),
  )(async (event) => {
    return {
      statusCode: 200,
      body: `User ID: ${event.routeParams.userId}`,
    };
  });

  it('should set meta data for middleware', () => {
    expect(handler.meta).toEqual({
      endpoint: {
        method,
        path: '/users/{userId}',
      },
    });
  });

  it('should pass data properly', () => {
    expect(
      handler({ pathParameters: { userId: 'USER_1' } } as Partial<APIGatewayProxyEvent> as any),
    ).resolves.toEqual({
      statusCode: 200,
      body: 'User ID: USER_1',
    });
  });

  describe('given path does not start with "/"', () => {
    it('should expect error', () => {
      // @ts-expect-error - Would throw if path do not start with '/'
      request('user');
    });
  });

  describe('given unknown route param is used', () => {
    it('should expect error', () => {
      compose(
        types<APIGatewayProxyEvent, Promise<void>>(),
        request('/users'),
      )(async (event) => {
        // @ts-expect-error - Would throw if unknown route param is used
        event.routeParams.unknown;
      });
    });
  });

  describe('given path without parameter', () => {
    it('should compile', () => {
      compose(types<APIGatewayProxyEvent, Promise<void>>(), request('/users'))(async () => {});
    });
  });

  describe('path with parameter', () => {
    it('should compile', () => {
      compose(
        types<APIGatewayProxyEvent, Promise<void>>(),
        request('/users/{userId}'),
      )(async (event) => {
        event.routeParams.userId;
      });
    });
  });

  describe('given path with multiple parameters', () => {
    it('should compile', () => {
      compose(
        types<APIGatewayProxyEvent, Promise<void>>(),
        request('/users/{userId}/friends/{friendId}'),
      )(async (event) => {
        event.routeParams.userId;
        event.routeParams.friendId;
      });
    });
  });
});
