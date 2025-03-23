import { compose, types } from '@thrty/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authorizer } from './authorizer';

const handler = compose(
  types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
  authorizer('default'),
)(async (event) => {
  return {
    statusCode: 200,
    body: `Hello, ${event.pathParameters?.test}`,
  };
});

it('should set meta data for authorizer', () => {
  expect(handler.meta).toEqual({ authorizerName: 'default' });
});

it('should pass data properly', () => {
  expect(handler({ pathParameters: { test: 'world' } } as any)).resolves.toEqual({
    statusCode: 200,
    body: 'Hello, world',
  });
});
