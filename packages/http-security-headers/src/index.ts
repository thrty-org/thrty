import { APIGatewayProxyResult } from 'aws-lambda';
import { Middleware } from '@thrty/core';

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
export const addSecurityHeaders = <T, R extends Promise<APIGatewayProxyResult>>({
  cacheControl = 'no-store',
  refererPolicy = 'strict-origin-when-cross-origin',
  strictTransportSecurity = 'max-age=31536000',
  contentTypeOptions = 'nosniff',
  xssProtection = '1; mode=block',
  xFrameOptions = 'SAMEORIGIN',
}: SecurityHeadersOptions = {}): Middleware<T, T, R, R> => {
  const securityHeaders = {
    ...(cacheControl
      ? { 'Cache-Control': Array.isArray(cacheControl) ? cacheControl.join(', ') : cacheControl }
      : {}),
    ...(refererPolicy
      ? {
          'Referrer-Policy': Array.isArray(refererPolicy)
            ? refererPolicy.join(', ')
            : refererPolicy,
        }
      : {}),
    ...(strictTransportSecurity ? { 'Strict-Transport-Security': strictTransportSecurity } : {}),
    ...(contentTypeOptions ? { 'X-Content-Type-Options': contentTypeOptions } : {}),
    ...(xssProtection ? { 'X-XSS-Protection': xssProtection } : {}),
    ...(xFrameOptions ? { 'X-Frame-Options': xFrameOptions } : {}),
  };
  return (next) =>
    (...args) =>
      next(...args).then(
        (response) =>
          ({
            ...response,
            headers: {
              ...securityHeaders,
              ...response.headers,
            },
          }) satisfies APIGatewayProxyResult,
      ) as R;
};

addSecurityHeaders({
  cacheControl: ['no-cache', 'must-revalidate'],
  refererPolicy: 'no-referrer',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
});

type CacheControl =
  | 'no-store'
  | CacheControlDirective
  | `${CacheControlDirective}, ${CacheControlDirective}`
  | CacheControlDirective[];
type CacheControlDirective =
  | `max-age=${number}`
  | `s-maxage=${number}`
  | `stale-while-revalidate=${number}`
  | `stale-if-error=${number}`
  | 'private'
  | 'public'
  | 'no-cache'
  | 'no-transform'
  | 'immutable'
  | 'must-revalidate'
  | 'must-understand'
  | 'proxy-revalidate';

type ReferrerPolicy =
  | ReferrerPolicyDirective
  | `${ReferrerPolicyDirective}, ${ReferrerPolicyDirective}`
  | ReferrerPolicyDirective[];
type ReferrerPolicyDirective =
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';

type StrictTransportSecurity =
  | `max-age=${number}`
  | `max-age=${number}; includeSubDomains`
  | `max-age=${number}; preload`
  | `max-age=${number}; includeSubDomains; preload`;

type XssProtection = '0' | '1' | '1; mode=block' | `1; report=${string}`;

type XFrameOptions = 'DENY' | 'SAMEORIGIN' | `ALLOW-FROM ${string}`;
