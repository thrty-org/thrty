import glob from 'glob';
import { parse } from 'path';
import { LambdaMeta } from './LambdaMeta';

export interface GetLambdaMetaOptions {
  handlerExportName?: string;
  lambdaNameTransformer?: (path: string) => string;
}
const defaults = {
  handlerExportName: 'handler',
  lambdaNameTransformer: (path: string) => {
    const name = parse(path).name.replace(/\.lambda$/, '');
    return name.charAt(0).toUpperCase() + name.slice(1);
  },
};

export const getLambdaMeta = (
  pattern: string,
  {
    handlerExportName = defaults.handlerExportName,
    lambdaNameTransformer = defaults.lambdaNameTransformer,
  }: GetLambdaMetaOptions = defaults,
): LambdaMeta[] =>
  glob.sync(pattern).map(path => {
    const lambdaName = lambdaNameTransformer(path);
    const meta = require(path)[handlerExportName]['meta'] ?? {};

    return {
      name: lambdaName,
      path,
      ...meta,
    } satisfies LambdaMeta;
  });
