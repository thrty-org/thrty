import { Middleware } from 'thirty/core';
import { HttpMethod } from './shared/httpMethods';
import { APIGatewayProxyEvent } from 'aws-lambda';

export const createEndpointMiddleware =
  <const TMethod extends HttpMethod>(method: TMethod) =>
  <TEvent extends APIGatewayProxyEvent, R, TPath extends `/${string}`>(
    path: TPath,
  ): Middleware<TEvent, OutputEvent<TEvent, TMethod, TPath>, R, R> =>
    Object.assign(
      (next: any) =>
        (event: TEvent, ...rest: any[]) =>
          next({ ...event, routeParams: event.pathParameters }, ...rest),
      {
        meta: {
          endpoint: {
            method,
            path,
          },
        } satisfies EndpointMeta,
      },
    );

export const get = createEndpointMiddleware('get');
export const put = createEndpointMiddleware('put');
export const patch = createEndpointMiddleware('patch');
export const post = createEndpointMiddleware('post');
export const $delete = createEndpointMiddleware('delete');
export const options = createEndpointMiddleware('options');
export const head = createEndpointMiddleware('head');
export const trace = createEndpointMiddleware('trace');

export interface EndpointMeta {
  endpoint: Endpoint;
}
export interface Endpoint {
  method: HttpMethod;
  path: string;
}

type OutputEvent<TInputEvent, TMethod extends HttpMethod, TPath extends string> = TInputEvent & {
  httpMethod: TMethod;
  routeParams: ExtractParams<TPath>;
};

type ExtractParams<Path> = Path extends `${infer Segment}/${infer Rest}`
  ? Segment extends `{${infer Param}}`
    ? Record<Param, string> & ExtractParams<Rest>
    : ExtractParams<Rest>
  : Path extends `{${infer Param}}`
    ? Record<Param, string>
    : {};
