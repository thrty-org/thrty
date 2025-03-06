import { ApiLambdaMeta } from '../../../api/src/cdk/getApiLambdaMeta';
import { printNode, zodToTs } from 'zod-to-ts';
import { Model, ModelFactory, ModelsMap, modelSourceKeys } from './ModelFactory';
import { CreateApiClientOptions } from '../createApi';

export default ((lambdaMetaList: ApiLambdaMeta[], options: CreateApiClientOptions): ModelsMap => {
  const modelMap = new Map<object, Model>();
  lambdaMetaList.forEach((lambdaMeta) => {
    modelSourceKeys.forEach((modelSourceKey) => {
      const zodType = lambdaMeta[modelSourceKey];
      if (zodType) {
        const tsType = printNode(zodToTs(zodType).node);
        const alias = options.modelAliases?.[modelSourceKey];
        const modelName = `${upperFirst(lambdaMeta.name)}${alias ?? upperFirst(modelSourceKey)}`;
        modelMap.set(zodType, { modelName, tsType });
      }
    });
  });
  return modelMap;
}) satisfies ModelFactory;

const upperFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
