import { compose, types } from '@thrty/core';
import { args } from '@thrty/testing';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { serialize } from 'cookie';
import { parseCookie } from './index';

const handler = compose(
  types<APIGatewayProxyEvent, any>(),
  parseCookie(),
)(async (event) => {
  return event.cookie;
});

it('should return cookie object', async () => {
  const cookieObject = await handler(
    ...args<APIGatewayProxyEvent>({ headers: { Cookie: serialize('test', '1') } }),
  );
  expect(cookieObject).toEqual({ test: '1' });
});
