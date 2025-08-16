import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { StoreProvider } from '@shared/store/StoreContext';

/**
 * Next.js App component with SSR-safe Zustand store provider
 *
 * The StoreProvider ensures that the Zustand store is properly initialized
 * for both server-side rendering and client-side hydration, preventing
 * the "setMoveErrorDialog is not a function" runtime error.
 *
 * @param root0
 * @param root0.Component
 * @param root0.pageProps
 */
export default function App({ Component, pageProps }: AppProps): React.JSX.Element {
  return (
    <StoreProvider>
      <Component {...pageProps} />
    </StoreProvider>
  );
}
