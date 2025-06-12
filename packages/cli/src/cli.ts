import { Command } from 'commander';
import { CreateApiClientOptions, createApiClient } from './api/createApi';
import { CreateApiPackageOptions, createApiPackage } from './api/createApiPackage';
import { join } from 'path';

const program = new Command();

type CreateApiClientCommandOptions = Omit<CreateApiClientOptions, 'pattern' | 'exportName'> & {
  name: string;
};
program
  .command('create-api-client')
  .option('-n, --name <string>', 'Name of the exported API client factory', 'api')
  .option('-o, --outPath <string>', 'Output path for the API client')
  .option('-c, --httpClient <string>', 'HTTP client to use (axios, fetch)', 'axios')
  .option('-m, --models <string>', 'Model generation strategy (zod)', 'zod')
  .argument('<glob>', 'Glob pattern to match API Lambda files')
  .action(async (glob: string, options: CreateApiClientCommandOptions) => {
    await createApiClient({
      ...options,
      exportName: `${options.name}Factory`,
      outPath: options.outPath ?? join(process.cwd(), `${options.name}Factory.ts`),
      pattern: glob,
    });
  });

type CreateApiPackageCommandOptions = Omit<
  CreateApiPackageOptions,
  'pattern' | 'exportName' | 'packageName'
> & {
  name: string;
};
program
  .command('create-api-package')
  .option('-n, --name <string>', 'Name of the exported API client factory', 'api')
  .option('-o, --outDir <string>', 'Output directory for the package')
  .option('-c, --httpClient <string>', 'HTTP client to use (axios, fetch)', 'axios')
  .option('-m, --models <string>', 'Model generation strategy (zod)', 'zod')
  .argument('<packageName>', 'Name of the npm package')
  .argument('<glob>', 'Glob pattern to match API Lambda files')
  .action(async (packageName: string, glob: string, options: CreateApiPackageCommandOptions) => {
    await createApiPackage({
      ...options,
      packageName,
      exportName: `${options.name}Factory`,
      outDir: options.outDir ?? join(process.cwd(), options.name),
      pattern: glob,
    });
  });

program.parse(process.argv);
