import { createApiPackage } from '@thrty/cli';
import { join } from 'path';
import { readdir } from 'node:fs/promises';
import { mkdirSync } from 'fs';
import { existsSync } from 'node:fs';

const distDir = join(__dirname, 'dist');
const outDir = join(distDir, 'todo-api-generated');
const exportName = 'todoApiFactory';

beforeAll(async () => {
  if (!existsSync(distDir)) mkdirSync(distDir);

  await createApiPackage({
    pattern: join(__dirname, '..', '__fixtures__', '*Lambda.ts'),
    outDir,
    packageName: 'test-api-generated',
    httpClient: 'axios',
    models: 'zod',
    exportName: 'todoApiFactory',
  });
});

it('should create package with source files and folders', async () => {
  const packagePathParts = await readdir(outDir);
  expect(packagePathParts).toEqual(['package.json', 'src']);

  const srcPathParts = await readdir(join(outDir, 'src'));
  expect(srcPathParts).toEqual(['index.ts']);
});

it('should create api factory', async () => {
  const module = require(join(outDir, 'src', 'index.ts'));
  const apiFactory = module[exportName];

  expect(apiFactory).toBeDefined();
});
