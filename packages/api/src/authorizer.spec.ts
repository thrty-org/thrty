import { compose } from '@thrty/core';
import { types } from 'thirty/core';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { APIGatewayProxyResult } from 'thirty/types';
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
