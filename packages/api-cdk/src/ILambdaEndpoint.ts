import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { LambdaIntegrationOptions, MethodOptions } from 'aws-cdk-lib/aws-apigateway';

export interface ILambdaEndpoint {
  fn: IFunction;
  integrationOptions: LambdaIntegrationOptions | undefined;
  methodOptions: MethodOptions | undefined;
}
