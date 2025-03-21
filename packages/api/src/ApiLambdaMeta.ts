import { EndpointMeta } from './endpoint';
import { AuthorizerMeta } from './authorizer';
import { StageVariableMeta } from './stageVariable';
import { ResponseBodyMeta } from './responseBody';
import { RequestBodyMeta } from './requestBody';
import { QueryParamsMeta } from './queryParams';

export type ApiLambdaMeta = EndpointMeta &
  AuthorizerMeta &
  StageVariableMeta &
  ResponseBodyMeta &
  RequestBodyMeta &
  QueryParamsMeta;

export const isApiLambdaMeta = <T extends object>(meta: T): meta is T & ApiLambdaMeta =>
  'endpoint' in meta && !!meta.endpoint;
