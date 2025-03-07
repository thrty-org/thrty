import { defineConfig } from 'tsup';
import defaultOptions from '../../tsup.options';

export default defineConfig({
  ...defaultOptions,
  banner: ({ format }) => {
    if (format === 'esm')
      return {
        js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
      };
    return {};
  },
});
