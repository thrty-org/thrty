import { defineConfig } from 'tsup';
import defaultOptions from '../../tsup.options';

export default defineConfig({
  ...defaultOptions,
  shims: true,
  banner: ({ format }) => {
    if (format === 'esm')
      return {
        js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
      };
    return {};
  },
});
