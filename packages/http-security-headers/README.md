<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/http-security-headers.
  <br>
</h1>

<h4 align="center">A middleware for adding security headers to HTTP responses</h4>

<p align="center">
    <img src="https://img.shields.io/npm/v/@thrty/http-security-headers.svg">
  <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/http-security-headers
```

### Usage
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { compose, types } from '@thrty/core';
import { addSecurityHeaders } from '@thrty/http-security-headers';
import { httpErrorHandler } from '@thrty/http-error-handler';

export const handler = compose(
  typesOf<APIGatewayProxyHandler>(),
  addSecurityHeaders(),
  httpErrorHandler(),
)(async event => {
  /* ... */
});
```

> ⚠️ The middleware should be used before the `httpErrorHandler` middleware, so that headers are also added in case of errors.

### Options
The `addSecurityHeaders` middleware accepts an options object with the following properties:

```typescript
export interface SecurityHeadersOptions {
  /**
   * Specifies value for 'Cache-Control' header.
   * @default 'no-store'
   */
  cacheControl?: CacheControl | false;

  /**
   * Specifies value for 'Referrer-Policy' header.
   * If set to false, the header will not be set.
   * @default 'strict-origin-when-cross-origin'
   */
  refererPolicy?: ReferrerPolicy | false;

  /**
   * Specifies value for 'Strict-Transport-Security' header.
   * If set to false, the header will not be set.
   * @default 'max-age=31536000'
   */
  strictTransportSecurity?: StrictTransportSecurity | false;

  /**
   * Specifies value for 'X-Content-Type-Options' header.
   * If set to false, the header will not be set.
   * @default 'nosniff'
   */
  contentTypeOptions?: 'nosniff' | false;

  /**
   * Specifies value for 'X-XSS-Protection' header.
   * If set to false, the header will not be set.
   * @default '1; mode=block'
   */
  xssProtection?: XssProtection | false;

  /**
   * Specifies value for 'X-Frame-Options' header.
   * If set to false, the header will not be set.
   * @default 'SAMEORIGIN'
   */
  xFrameOptions?: XFrameOptions | false;
}
```