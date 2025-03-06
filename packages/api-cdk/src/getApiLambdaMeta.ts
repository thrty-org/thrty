import { getLambdaMeta, GetLambdaMetaOptions, LambdaMeta } from '@thrty/meta';
import { Endpoint } from '@thrty/api';

export type ApiLambdaMeta = LambdaMeta & {
  endpoint: Endpoint;
  authorizerName?: string;
  requestBody?: any;
  responseBody?: any;
} & {
  [K in `stageVariable:${string}`]: string;
};

export const getApiLambdaMeta = (pattern: string, options?: GetLambdaMetaOptions) =>
  getLambdaMeta(pattern, options).filter((meta): meta is ApiLambdaMeta => !!meta.endpoint);
