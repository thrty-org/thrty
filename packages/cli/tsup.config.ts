import { defineConfig } from 'tsup';
import defaultOptions from '../../tsup.options';

export default defineConfig({
  ...defaultOptions,
  external: ['commander'],
  entry: ['src/index.ts', 'src/cli.ts'],
});
