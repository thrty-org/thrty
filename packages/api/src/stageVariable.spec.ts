import { compose, types } from '@thrty/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { stageVariable } from './stageVariable';

const handler = compose(
  types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
  stageVariable('isSpecial', true),
)(async (event) => {
  return {
    statusCode: 200,
    body: `Hello, ${event.pathParameters?.test}`,
  };
});

it('should set meta data for stage variable', () => {
  expect(handler.meta).toEqual({ 'stageVariable:isSpecial': true });
});

it('should pass data properly', () => {
  expect(handler({ pathParameters: { test: 'world' } } as any)).resolves.toEqual({
    statusCode: 200,
    body: 'Hello, world',
  });
});
