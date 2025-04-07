import { compose, types } from '@thrty/core';
import { inject } from '@thrty/inject';
import { fromPartial } from '@thrty/testing';
import {
  ForbiddenError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from '@thrty/http-errors';
import {
  APIGatewayEvent,
  APIGatewayProxyEvent,
  APIGatewayProxyResult as AwsLambdaAPIGatewayProxyResult,
} from 'aws-lambda';
import { httpErrorHandler } from './index';

type APIGatewayProxyResult = Omit<AwsLambdaAPIGatewayProxyResult, 'body'> & {
  body?: string;
};

describe('simple setup', () => {
  let throwError: jest.Mock;
  let handler = compose(
    types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
    httpErrorHandler({ logger: false }),
  )(async (event) => {
    throwError();

    return {
      statusCode: 200,
    };
  });

  beforeAll(() => {
    throwError = jest.fn();
  });

  it('should return response with statusCode and message of thrown error', async () => {
    const error = { message: 'BadRequest', statusCode: 400 };
    throwError.mockImplementation(() => {
      throw new BadRequestError('BadRequest');
    });
    const response = await handler(fromPartial<APIGatewayProxyEvent>({}));

    expect(response).toEqual({
      statusCode: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
      }),
    });
  });

  it('should return InternalServerError, since unknown errors are obfuscated by default', async () => {
    throwError.mockImplementation(() => {
      throw new Error('Test');
    });
    const response = await handler(fromPartial<APIGatewayProxyEvent>({}));

    expect(response).toEqual({
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'InternalServerError',
      }),
    });
  });

  it('should return InternalServerError with obfuscated error message', async () => {
    throwError.mockImplementation(() => {
      throw new InternalServerError('Sensitive data');
    });
    const response = await handler(fromPartial<APIGatewayProxyEvent>({}));

    expect(response).toEqual({
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'InternalServerError',
      }),
    });
  });

  it('should return Unauthorized with obfuscated error message', async () => {
    throwError.mockImplementation(() => {
      throw new UnauthorizedError('Sensitive data');
    });
    const response = await handler(fromPartial<APIGatewayProxyEvent>({}));

    expect(response).toEqual({
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Unauthorized',
      }),
    });
  });

  it('should return Forbidden with obfuscated error message', async () => {
    throwError.mockImplementation(() => {
      throw new ForbiddenError('Sensitive data');
    });
    const response = await handler(fromPartial<APIGatewayProxyEvent>({}));

    expect(response).toEqual({
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Forbidden',
      }),
    });
  });
});

describe('blacklist', () => {
  const handler = compose(
    types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
    httpErrorHandler({
      logger: false,
      blacklist: [{ alternativeMessage: 'Error', statusCode: 404 }],
    }),
  )(async (event) => {
    throwError();

    return {
      statusCode: 200,
    };
  });
  let throwError: jest.Mock;

  beforeAll(() => {
    throwError = jest.fn();
  });

  it('should return "Error" with statusCode "404"', async () => {
    throwError.mockImplementation(() => {
      throw new NotFoundError('Sensitive data');
    });
    const response = await handler(fromPartial<APIGatewayProxyEvent>({}));

    expect(response).toEqual({
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Error',
      }),
    });
  });

  it('should not obfuscate error since it is not blacklisted', async () => {
    throwError.mockImplementation(() => {
      throw new UnauthorizedError('Sensitive data');
    });
    const response = await handler(fromPartial<APIGatewayProxyEvent>({}));

    expect(response).toEqual({
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Sensitive data',
      }),
    });
  });
});

describe('event.deps.logger', () => {
  const handler = compose(
    types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
    inject({
      logger: () => ({ error: logError }),
    }),
    httpErrorHandler(),
  )(async (event) => {
    throwError();

    return {
      statusCode: 200,
    };
  });
  let throwError: jest.Mock;
  let logError: jest.Mock;

  beforeAll(() => {
    throwError = jest.fn();
    logError = jest.fn();
  });

  it('should call logger.error with original message', async () => {
    const error = new Error('Something went wrong');
    throwError.mockImplementation(() => {
      throw error;
    });
    await handler(fromPartial<APIGatewayProxyEvent>({}));
    expect(logError).toHaveBeenCalledWith(error);
  });
});

describe('options.logger', () => {
  let handler: any;
  let throwError: jest.Mock;
  let logError: jest.Mock;

  beforeAll(() => {
    throwError = jest.fn();
    logError = jest.fn();
    handler = compose(
      types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
      httpErrorHandler({
        logger: { error: logError },
      }),
    )(async (event) => {
      throwError();

      return {
        statusCode: 200,
      };
    });
  });

  it('should call logger.error with original message', async () => {
    const error = new Error('Something went wrong');
    throwError.mockImplementation(() => {
      throw error;
    });
    await handler(fromPartial<APIGatewayProxyEvent>({}));
    expect(logError).toHaveBeenCalledWith(error);
  });
});
