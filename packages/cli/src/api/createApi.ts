import { writeFileSync } from 'fs';
import { GetLambdaMetaOptions, getLambdaMeta } from '@thrty/meta';
import { HttpClientTemplateFactory } from './httpClients/HttpClientTemplateFactory';
import { ModelFactory, modelSourceKeys } from './models/ModelFactory';
import { isApiLambdaMeta } from '@thrty/api';

const lowerFirst = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);

export type CreateApiClientOptions = {
  outPath: string;
  exportName: string;
  httpClient: 'axios' | 'fetch';
  models: 'zod';
  pattern: string;
  modelAliases?: {
    [K in (typeof modelSourceKeys)[number]]: string;
  };
} & GetLambdaMetaOptions;

export const createApiClient = async (options: CreateApiClientOptions) => {
  const httpClient: HttpClientTemplateFactory = (
    await import(`./httpClients/${options.httpClient}.ts`)
  ).default;
  const modelFactory: ModelFactory = (await import(`./models/${options.models}.ts`)).default;
  const { pattern, exportName, outPath, ...rest } = options;
  const metaList = getLambdaMeta(pattern, rest).filter(isApiLambdaMeta);
  const modelsMap = modelFactory(metaList, options);
  const apiFactory = `${httpClient.createGlobals()}
${[...modelsMap.entries()]
  .map(
    ([, { modelName, tsType }]) => `
export type ${modelName} = ${tsType};`,
  )
  .join('\n')}
export const ${exportName} = (${httpClient.createOptions()}) => ({
${metaList
  .map((meta) => {
    const requestBodyType = meta.requestBody
      ? modelsMap.get(meta.requestBody)?.modelName
      : undefined;
    const responseBodyType = meta.responseBody
      ? modelsMap.get(meta.responseBody)?.modelName
      : undefined;
    const routeParams = meta.endpoint.path.match(/{([^}]+)}/g)?.map((param) => param.slice(1, -1));
    const PATH = 'path';
    const OPTIONS = 'options';
    const REQUEST_BODY = 'data';
    const implementation = httpClient.createEndpointImplementation({
      requestBodyType,
      responseBodyType,
      requestBody: REQUEST_BODY,
      options: OPTIONS,
      path: PATH,
      method: meta.endpoint.method,
    });

    return `
  async ${lowerFirst(meta.name)}(
    ${routeParams?.map((param) => `${param}: string,`).join('\n') ?? ''}
    ${requestBodyType ? `${REQUEST_BODY}: ${requestBodyType},` : ''}
    ${OPTIONS}?: ${implementation.endpointOptionsType}
  ): ${implementation.returnType} {
    const ${PATH} = '${meta.endpoint.path}'${
      routeParams?.length
        ? routeParams
            .map((param) => `.replace('{${param}}', encodeURIComponent(String(${param})))`)
            .join('')
        : ''
    };
    ${implementation.template}
  },
  `;
  })
  .join('\n')}
});
  `.replaceAll('\n\n', '\n');
  writeFileSync(outPath, apiFactory.replace(/^\s*\n/gm, ''));
};
