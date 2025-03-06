import { EndpointImplementationOptions, HttpClientTemplateFactory } from './HttpClientTemplateFactory';

export const HTTP_CLIENT = 'httpClient';

export default {
  createEndpointImplementation({ path, method, responseBodyType, requestBodyType, requestBody, options }: EndpointImplementationOptions) {
    return {
      returnType: `Promise<AxiosResponse<${responseBodyType ?? 'unknown'}>>`,
      endpointOptionsType: 'AxiosRequestConfig<any>',
      template: `return ${HTTP_CLIENT}<${responseBodyType ?? 'unknown'}>(${path}, {
      method: '${method}',
      ${requestBodyType ? `${requestBody},` : ''}
      ...${options},
    });`,
    };
  },

  createGlobals() {
    return `
    import { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
    `;
  },

  createOptions() {
    return `{${HTTP_CLIENT}}: {${HTTP_CLIENT}: AxiosInstance }`;
  },
} satisfies HttpClientTemplateFactory;
