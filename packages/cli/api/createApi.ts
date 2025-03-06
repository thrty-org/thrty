import { writeFileSync } from 'fs';
import { getApiLambdaMeta } from '../../api/src/cdk/getApiLambdaMeta';
import { GetLambdaMetaOptions } from '@thrty/meta/src/getLambdaMeta';
import { HttpClientTemplateFactory } from './httpClients/HttpClientTemplateFactory';
import { ModelFactory, modelSourceKeys } from './models/ModelFactory';

const lowerFirst = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);

export type CreateApiClientOptions = {
  outPath: string;
  name: string;
  httpClient: 'axios' | 'fetch';
  models: 'zod' | 'valibot';
  pattern: string;
  modelAliases?: {
    [K in (typeof modelSourceKeys)[number]]: string;
  };
} & GetLambdaMetaOptions;

export const createApiClient = (options: CreateApiClientOptions) => {
  const httpClient: HttpClientTemplateFactory = require(
    `./httpClients/${options.httpClient}`,
  ).default;
  const modelFactory: ModelFactory = require(`./models/${options.models}`).default;
  const { pattern, name, outPath, ...rest } = options;
  const metaList = getApiLambdaMeta(pattern, rest);
  const modelsMap = modelFactory(metaList, options);
  const apiFactory = `${httpClient.createGlobals()}
${[...modelsMap.entries()]
  .map(
    ([, { modelName, tsType }]) => `
export type ${modelName} = ${tsType};`,
  )
  .join('\n')}
export const ${options.name}Factory = (${httpClient.createOptions()}) => ({
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
  writeFileSync(outPath, apiFactory);
};
