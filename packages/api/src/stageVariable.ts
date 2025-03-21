import { APIGatewayProxyEvent } from 'aws-lambda';
import { Middleware } from 'thirty/core';

export type StageVariableMeta = {
  [K in `stageVariable:${string}`]: string;
};
export const STAGE_VARIABLE_PREFIX = 'stageVariable:';
export const stageVariable = <TEvent extends APIGatewayProxyEvent, R>(
  key: string,
  value: any,
): Middleware<TEvent, TEvent, R, R> =>
  Object.assign(
    (next: any) =>
      (...args: any[]) =>
        next(...args),
    {
      meta: {
        [`${STAGE_VARIABLE_PREFIX}${key}`]: value,
      } satisfies StageVariableMeta,
    },
  );
