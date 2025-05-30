import { compose, types, of } from '@thrty/core';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { serializeJson } from './index';

describe('given no body type is specified', () => {
  const createHandler = () =>
    compose(
      types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
      serializeJson(),
    )(async (event) => {
      return {
        statusCode: 200,
        body: {
          test: '1',
        },
      };
    });

  let handler: ReturnType<typeof createHandler>;
  let result: Awaited<ReturnType<typeof handler>>;

  beforeEach(async () => {
    handler = createHandler();
    result = await handler({} as any);
  });

  it('should return serialized response body', () => {
    expect(result.body).toEqual(JSON.stringify({ test: '1' }));
  });

  it('should return content-type header', () => {
    expect(result.headers).toEqual({
      'Content-Type': 'application/json',
    });
  });
});

describe('given body type is specified', () => {
  interface Message {
    id: string;
    description: string;
  }

  const createHandler = () =>
    compose(
      types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
      serializeJson(of<Message>),
    )(async (event) => {
      return {
        statusCode: 200,
        body: {
          id: 'MESSAGE_1',
          description: 'MESSAGE_DESCRIPTION_1',
        },
      };
    });

  let handler: ReturnType<typeof createHandler>;
  let result: Awaited<ReturnType<typeof handler>>;

  beforeEach(async () => {
    handler = createHandler();
    result = await handler({} as any);
  });

  it('should return serialized response body', () => {
    expect(result.body).toEqual(
      JSON.stringify({ id: 'MESSAGE_1', description: 'MESSAGE_DESCRIPTION_1' }),
    );
  });

  it('should return content-type header', () => {
    expect(result.headers).toEqual({
      'Content-Type': 'application/json',
    });
  });
});

describe('given body type is specified but not returned properly', () => {
  it('should throw ts error', () => {
    compose(
      types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
      serializeJson(of<{ id: string; description: string }>),
      // @ts-expect-error
    )(async (event) => {
      return {
        statusCode: 200,
        body: {
          unknown: true,
        },
      };
    });
  });
});
