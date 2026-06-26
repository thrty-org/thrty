import { APIGatewayProxyEvent } from 'aws-lambda';
import { compose, types, of } from '@thrty/core';
import { parseRequestBody } from './index';

let handler: any;
const body = { name: 'bob', age: 12 };

beforeEach(() => {
  handler = compose(
    types<APIGatewayProxyEvent, any>(),
    parseRequestBody(),
  )(async (event) => {
    return event.jsonBody;
  });
});

it('should parse the request body as JSON', async () => {
  const jsonBody = await handler({ body: JSON.stringify(body) });
  expect(jsonBody).toEqual(body);
});

describe('given body type is specified', () => {
  describe('and only valid properties are accessed', () => {
    it('should not throw ts errors', () => {
      handler = compose(
        types<APIGatewayProxyEvent, any>(),
        parseRequestBody(of<{ id: string; description: string }>),
      )(async (event) => {
        event.jsonBody.id;
        event.jsonBody.description;
      });
    });
  });
  describe('and invalid properties are accessed', () => {
    it('should throw ts error', () => {
      handler = compose(
        types<APIGatewayProxyEvent, any>(),
        parseRequestBody(of<{ id: string; description: string }>),
      )(async (event) => {
        // @ts-expect-error
        event.jsonBody.unknown;
      });
    });
  });
});
