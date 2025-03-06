export interface HttpClientTemplateFactory {
  createEndpointImplementation: (options: EndpointImplementationOptions) => {
    template: string;
    returnType: string;
    endpointOptionsType: string;
  };
  createGlobals: () => string;
  createOptions: () => string;
}

export interface EndpointImplementationOptions {
  path: string;
  method: string;
  requestBodyType: string | undefined;
  requestBody: string | undefined;
  responseBodyType: string | undefined;
  options: string;
}
