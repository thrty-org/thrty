<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/cors
  <br>
</h1>

<h4 align="center">A middleware for adding CORS headers to an API Gateway responses including OPTIONS requests</h4>

<p align="center">
<img src="https://img.shields.io/npm/v/@thrty/cors.svg">
  <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/cors
```

### Usage
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { compose, types } from '@thrty/core';
import { handleCors } from '@thrty/cors';
import { httpErrorHandler } from '@thrty/http-error-handler';

export const handler = compose(
  typesOf<APIGatewayProxyHandler>(),
  inject({
    ...todoRepositoryProviders,
  }),
  handleCors(),
  httpErrorHandler(),
)(async event => {
  /* ... */
});
```

> ⚠️ The middleware should be used before the `httpErrorHandler` middleware, so that CORS headers are also added in case of errors.

### Options
The `handleCors` middleware accepts an options object with the following properties:

```typescript
export interface CorsOptions {
  /**
   * When true, creates response on OPTIONS request with 'Access-Control-Allow-*'
   * headers
   * @default true
   */
  preflight?: boolean;

  /**
   * When true, uses 'Origin' header from request as 'Access-Control-Allow-Origin'
   * in response.
   * @default '*'
   */
  origin?: true | string | string[];

  /**
   * Specifies value for 'Access-Control-Allow-Credentials' header
   * @default true
   */
  credentials?: boolean;

  /**
   * Specifies value for 'Access-Control-Allow-Headers' header
   * When set to true, headers from 'Access-Control-Request-Headers' will be
   * used
   * @default ['Content-Type']
   */
  headers?: string[] | true;

  /**
   * Specifies values for 'Access-Control-Allow-Methods' header.
   * @default ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
   */
  methods?: string[];

  /**
   * Specifies values for 'Access-Control-Allow-Max-Age' header.
   * @default false
   */
  maxAge?: number | false;
}
```