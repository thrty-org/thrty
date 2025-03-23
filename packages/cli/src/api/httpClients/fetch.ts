import {
  HttpClientTemplateFactory,
  EndpointImplementationOptions,
} from './HttpClientTemplateFactory';

export const BASE_URL = 'baseUrl';
export const REQUEST_INTERCEPTOR = 'requestInterceptor';
export const REQUEST_INTERCEPTOR_TYPE = 'RequestInterceptor';
export const RESPONSE_TYPE = 'FetchResponse';
export const REQUEST_TYPE = 'FetchRequest';

export default {
  createEndpointImplementation({
    path,
    method,
    responseBodyType,
    requestBody,
    requestBodyType,
    options,
  }: EndpointImplementationOptions) {
    return {
      returnType: `Promise<${RESPONSE_TYPE}<${responseBodyType ?? 'unknown'}>>`,
      endpointOptionsType: 'Request',
      template: `
      const request: ${REQUEST_TYPE} = {${
        requestBodyType ? `data: ${requestBody},` : ''
      } method: '${method}', baseUrl: ${BASE_URL}, path: ${path}};
      return fetch(request.baseUrl + request.path, {...request, ...(await ${REQUEST_INTERCEPTOR}?.(request)), ...${options}}).then(async res => ({data: await res.json(), ...res}));
    `,
    };
  },

  createGlobals() {
    return `
    type ${REQUEST_TYPE} = RequestInit & { data?: unknown; baseUrl: string; path: string; };
    type ${RESPONSE_TYPE}<T> = { data: T; } & Response;
    type ${REQUEST_INTERCEPTOR_TYPE} = (request: ${REQUEST_TYPE}) => Request | Promise<${REQUEST_TYPE}>;
    `;
  },

  createOptions() {
    return `{${BASE_URL}, ${REQUEST_INTERCEPTOR}}: {${BASE_URL}: string; ${REQUEST_INTERCEPTOR}?: ${REQUEST_INTERCEPTOR_TYPE}}`;
  },
} satisfies HttpClientTemplateFactory;
