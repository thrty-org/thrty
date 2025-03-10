import { glob } from 'glob';
import { parse } from 'path';
import { spawnSync } from 'child_process';
import { LambdaMeta } from './LambdaMeta';

export interface GetLambdaMetaOptions {
  handlerExportName?: string;
  lambdaNameTransformer?: (path: string) => string;
  useChildProcess?: boolean;
}
const defaults = {
  handlerExportName: 'handler',
  lambdaNameTransformer: (path: string) => {
    const name = parse(path).name.replace(/\Lambda$/, '');
    return name.charAt(0).toUpperCase() + name.slice(1);
  },
};

const OUTPUT_DELEMITER = '__delemiter__';
const CHILD_PROCESS_FLAG = '--meta-child-process';

export const getLambdaMeta = (
  pattern: string,
  options: GetLambdaMetaOptions = defaults,
): LambdaMeta[] => {
  const {
    handlerExportName = defaults.handlerExportName,
    lambdaNameTransformer = defaults.lambdaNameTransformer,
  } = options;
  const { useChildProcess, ...optionsForChildProcess } = options;

  let metaList;
  if (useChildProcess) {
    const child = spawnSync('npx', ['tsx', __filename, CHILD_PROCESS_FLAG], {
      input: JSON.stringify({
        pattern,
        ...optionsForChildProcess,
      }),
      stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });
    if (child.error) {
      throw child.error;
    }
    const [, result] = child.stdout?.split(OUTPUT_DELEMITER);
    metaList = JSON.parse(result);
  } else {
    metaList = glob.sync(pattern).map((path) => {
      const meta = require(path)[handlerExportName]['meta'] ?? {};
      return {
        path,
        ...meta,
      } satisfies LambdaMeta;
    });
  }
  if (!metaList) {
    throw new Error('Could not retrieve meta data due to unknown error');
  }

  return metaList.map((meta: any) => ({
    ...meta,
    name: lambdaNameTransformer(meta.path),
  }));
};

if (process.argv.includes(CHILD_PROCESS_FLAG)) {
  let optionsStr = '';
  process.stdin.on('data', (chunk) => (optionsStr += chunk)); // Read stdin
  process.stdin.on('end', () => {
    const options = JSON.parse(optionsStr);
    const lambdaMetaList = getLambdaMeta(options.pattern, options);
    console.log(OUTPUT_DELEMITER);
    console.log(JSON.stringify(lambdaMetaList));
    console.log(OUTPUT_DELEMITER);
  });
}
