import { Options } from 'tsup';

export default {
  entry: ['src/index.ts'],
  splitting: true,
  sourcemap: true,
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: true,
} satisfies Options;
