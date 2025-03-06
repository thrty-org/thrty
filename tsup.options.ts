import { Options } from 'tsup';

export default {
  entry: ['src/index.ts'],
  splitting: true,
  sourcemap: true,
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: true,
  banner: ({ format }) => {
    if (format === 'esm')
      return {
        js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
      };
    return {};
  },
} satisfies Options;
