import React from 'react';
import type { AppProps, AppContext } from 'next/app';
import App from 'next/app';
import '../styles/globals.css';
import { EngineProvider } from '@shared/contexts/EngineContext';

type MyAppProps = AppProps & {
  pageProps: {
    isTestMode?: boolean;
  };
};

function MyApp({ Component, pageProps }: MyAppProps) {
  // Extract our custom prop and pass the rest to the page
  const { isTestMode, ...restPageProps } = pageProps;
  
  return (
    <EngineProvider testMode={isTestMode}>
      <Component {...restPageProps} />
    </EngineProvider>
  );
}

// Note: Using getInitialProps in _app.tsx disables Automatic Static Optimization (ASO)
// for the entire application. This means no pages can be statically generated (SSG).
// We accept this trade-off to enable per-request E2E test mode detection via
// headers, which is critical for solving SSR/CSR consistency issues during tests.
MyApp.getInitialProps = async (appContext: AppContext) => {
  // Fetch initial props from the page
  const appProps = await App.getInitialProps(appContext);
  const req = appContext.ctx.req;
  
  // Check for our custom header ONLY on the server-side request object
  const isTestMode = !!req?.headers['x-e2e-test-mode'];
  
  return {
    ...appProps,
    pageProps: {
      ...appProps.pageProps,
      isTestMode: isTestMode,
    },
  };
};

export default MyApp; 