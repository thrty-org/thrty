import { join } from 'path';
import { CreateApiClientOptions, createApiClient } from './createApi';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';

export type CreateApiPackageOptions = Omit<CreateApiClientOptions, 'outPath'> & {
  packageName: string;
  outDir: string;
};
export const createApiPackage = async ({
  packageName,
  outDir,
  ...options
}: CreateApiPackageOptions) => {
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true });
  }
  mkdirSync(outDir);
  mkdirSync(join(outDir, 'src'));
  writeFileSync(
    `${outDir}/package.json`,
    JSON.stringify(
      {
        name: packageName,
        version: '1.0.0',
        type: 'module',
        main: './dist/index.cjs',
        module: './dist/index.js',
        types: './dist/index.d.ts',
        exports: {
          import: {
            types: './dist/index.d.ts',
            import: './dist/index.js',
          },
          require: {
            types: './dist/index.d.cts',
            require: './dist/index.cjs',
          },
        },
        scripts: {
          build: 'tsup',
        },
        dependencies: {
          tsup: '^8.4.0',
        },
        tsup: {
          clean: true,
          dts: true,
          entryPoints: ['src/index.ts'],
          format: ['cjs', 'esm'],
          splitting: true,
          sourcemap: true,
          target: 'node16',
        },
      },
      null,
      2,
    ),
  );
  await createApiClient({
    ...options,
    outPath: join(outDir, 'src', `index.ts`),
  });
};
