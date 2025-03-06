import { ApiLambdaMeta } from '@thrty/api-cdk';
import { CreateApiClientOptions } from '../createApi';

export type Model = { modelName: string; tsType: string };
export type ModelsMap = Map<object, Model>;
export type ModelFactory = (
  lambdaMetaList: ApiLambdaMeta[],
  options: CreateApiClientOptions,
) => ModelsMap;
export const modelSourceKeys = ['requestBody', 'responseBody'] as const satisfies Array<
  keyof ApiLambdaMeta
>;
