import React from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { EngineProvider } from '@shared/contexts/EngineContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <EngineProvider>
      <Component {...pageProps} />
    </EngineProvider>
  );
}

export default MyApp; 