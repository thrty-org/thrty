import { APIGatewayProxyEvent } from 'aws-lambda';
import { eventType, compose } from '@thrty/core';
import { fromPartial } from '@thrty/testing';
import { normalizeHeaders } from './index';

const handler = compose(
  eventType<APIGatewayProxyEvent>(),
  normalizeHeaders(),
)(async (event) => {
  return event.headers;
});

it('should return sanitized headers', async () => {
  const sanitizedHeaders = await handler(
    fromPartial<APIGatewayProxyEvent>({ headers: { A: '1', b: '2', Cd: '3', 'T-e-S-t': '4' } }),
  );
  expect(sanitizedHeaders).toEqual({ a: '1', b: '2', cd: '3', 't-e-s-t': '4' });
});

it('should not throw and should return empty object if headers are falsy', async () => {
  await expect(handler(fromPartial<APIGatewayProxyEvent>({}))).resolves.toEqual({});
});
