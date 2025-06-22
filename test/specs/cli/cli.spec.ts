import { spawnSync } from 'child_process';
import { SpawnSyncReturns } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { join } from 'path';
import { existsSync } from 'node:fs';
import { mkdirSync } from 'fs';

describe('thrty create-api-client', () => {
  let result: SpawnSyncReturns<Buffer>;

  describe.each([
    ['--httpClient', 'axios'],
    ['--httpClient', 'fetch'],
  ])('%s=%s', (httpClientFlag, httpClientOption) => {
    const outPath = join('dist', `${httpClientOption}TodoApi.ts`);

    beforeAll(() => {
      const outDir = join(__dirname, 'dist');
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }
      result = spawnSync('npx', [
        'thrty',
        'create-api-client',
        'specs/__fixtures__/*Lambda.ts',
        '--name=todoApi',
        `--outPath=specs/cli/${outPath}`,
        `${httpClientFlag}=${httpClientOption}`,
        '--models=zod',
      ]);
    });

    it('should not result in errors', () => {
      expect(result.stderr.toString()).toEqual('');
    });

    it('should create api client', async () => {
      const { todoApiFactory }: any = await import(`./${outPath}` as any);
      expect(todoApiFactory.toString()).toMatchSnapshot();
    });
  });
});

describe('thrty create-api-package', () => {
  let result: SpawnSyncReturns<Buffer>;

  const outDir = join('dist', `todo-api-generated`);

  beforeAll(() => {
    result = spawnSync('npx', [
      'thrty',
      'create-api-package',
      'todo-api-generated',
      'specs/__fixtures__/*Lambda.ts',
      '--name=todoApi',
      `--outDir=specs/cli/${outDir}`,
      '--httpClient=axios',
      '--models=zod',
    ]);
  });

  it('should not result in errors', () => {
    expect(result.stderr.toString()).toEqual('');
  });

  it('should create package with source files and folders', async () => {
    const _outDir = join(__dirname, outDir);
    const packagePathParts = await readdir(_outDir);
    expect(packagePathParts).toEqual(['package.json', 'src']);

    const srcPathParts = await readdir(join(_outDir, 'src'));
    expect(srcPathParts).toEqual(['index.ts']);
  });
});
