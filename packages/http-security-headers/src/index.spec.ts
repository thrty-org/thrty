import { compose, typesOf } from '@thrty/core';
import { fromPartial } from '@thrty/testing';
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { addSecurityHeaders } from './index';

describe('given no options are set', () => {
  const handler = compose(
    typesOf<APIGatewayProxyHandler>(),
    addSecurityHeaders(),
  )(async () => {
    return {
      statusCode: 200,
      body: JSON.stringify({}),
    };
  });

  let result: Awaited<ReturnType<typeof handler>>;

  beforeEach(async () => {
    result = await handler(fromPartial<APIGatewayProxyEvent>({}));
  });

  it('should return headers', () => {
    expect(result.headers).toEqual({
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'X-Frame-Options': 'SAMEORIGIN',
    });
  });
});

describe('given custom options are set', () => {
  const handler = compose(
    typesOf<APIGatewayProxyHandler>(),
    addSecurityHeaders({
      cacheControl: 'no-cache, immutable',
      refererPolicy: 'strict-origin, no-referrer',
      strictTransportSecurity: 'max-age=0; includeSubDomains',
      contentTypeOptions: 'nosniff',
      xssProtection: '0',
      xFrameOptions: 'ALLOW-FROM https://example.com',
    }),
  )(async () => {
    return {
      statusCode: 200,
      body: JSON.stringify({}),
    };
  });

  let result: Awaited<ReturnType<typeof handler>>;

  beforeEach(async () => {
    result = await handler(fromPartial<APIGatewayProxyEvent>({}));
  });

  it('should return headers', () => {
    expect(result.headers).toEqual({
      'Cache-Control': 'no-cache, immutable',
      'Referrer-Policy': 'strict-origin, no-referrer',
      'Strict-Transport-Security': 'max-age=0; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '0',
      'X-Frame-Options': 'ALLOW-FROM https://example.com',
    });
  });
});

describe('given all headers are deactivated', () => {
  const handler = compose(
    typesOf<APIGatewayProxyHandler>(),
    addSecurityHeaders({
      cacheControl: false,
      refererPolicy: false,
      strictTransportSecurity: false,
      contentTypeOptions: false,
      xssProtection: false,
      xFrameOptions: false,
    }),
  )(async () => {
    return {
      statusCode: 200,
      body: JSON.stringify({}),
    };
  });

  let result: Awaited<ReturnType<typeof handler>>;

  beforeEach(async () => {
    result = await handler(fromPartial<APIGatewayProxyEvent>({}));
  });

  it('should return empty headers', () => {
    expect(result.headers).toEqual({});
  });
});
