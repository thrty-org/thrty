import nextra from 'nextra';

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  defaultShowCopyCode: true,
});

export default withNextra({
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '/thrty',
  images: { unoptimized: true },
  reactStrictMode: true,
});
