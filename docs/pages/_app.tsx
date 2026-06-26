import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${inter.style.fontFamily}, system-ui, -apple-system, sans-serif;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
