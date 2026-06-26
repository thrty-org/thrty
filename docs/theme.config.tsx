import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <img src="/thrty/logo.svg" alt="" width={28} height={28} />
      <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>thrty</span>
    </span>
  ),
  project: { link: 'https://github.com/thrty-org/thrty' },
  docsRepositoryBase: 'https://github.com/thrty-org/thrty/tree/main/docs',
  primaryHue: 259,
  primarySaturation: 90,
  head: (
    <>
      <link rel="icon" type="image/svg+xml" href="/thrty/logo.svg" />
      <meta name="theme-color" content="#8C52FF" />
      <meta name="og:title" content="thrty" />
      <meta
        name="og:description"
        content="A type-safe middleware engine for AWS Lambda"
      />
    </>
  ),
  footer: {
    text: (
      <span style={{ fontSize: '0.875rem' }}>
        ISC {new Date().getFullYear()} ©{' '}
        <a href="https://github.com/thrty-org/thrty" target="_blank" rel="noreferrer">
          thrty
        </a>
        .
      </span>
    ),
  },
  banner: {
    key: 'thrty-alpha',
    text: (
      <a href="https://github.com/thrty-org/thrty/releases" target="_blank" rel="noreferrer">
        thrty 3.0 is in alpha — track releases on GitHub →
      </a>
    ),
  },
  useNextSeoProps() {
    return { titleTemplate: '%s — thrty' };
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
  feedback: {
    content: null,
  },
  editLink: {
    text: 'Edit this page on GitHub →',
  },
};

export default config;
