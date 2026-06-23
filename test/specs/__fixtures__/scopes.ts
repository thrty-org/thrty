import { stageVariable } from '@thrty/api';
import { APIGatewayProxyEvent } from 'aws-lambda';

export const scopes = <T extends APIGatewayProxyEvent, C, R>(...values: string[]) =>
  stageVariable<T, C, R>('scopes', values);
