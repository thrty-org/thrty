import { stageVariable } from '@thrty/api';
import { APIGatewayProxyEvent } from 'aws-lambda';

export const scopes = <T extends APIGatewayProxyEvent, R>(...values: string[]) =>
  stageVariable<T, R>('scopes', values);
