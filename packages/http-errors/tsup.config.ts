import { defineConfig } from 'tsup';
import defaultOptions from '../../tsup.options';

export default defineConfig({
  ...defaultOptions,
  keepNames: true,
});
