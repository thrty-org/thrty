import type { APIGatewayProxyResult as _APIGatewayProxyResult } from 'aws-lambda';

/**
 * Same as `aws-lambda`'s `APIGatewayProxyResult` but with `body` optional —
 * matching API Gateway's actual behavior for empty responses (e.g. `204 No
 * Content`). The upstream type marks `body: string` as mandatory, which
 * doesn't reflect real-world usage.
 *
 * @example
 * const res: APIGatewayProxyResult = { statusCode: 204 };
 */
export interface APIGatewayProxyResult extends Omit<_APIGatewayProxyResult, 'body'> {
  body?: string;
}
