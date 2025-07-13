import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import { useTraining } from '@shared/store/store';
import { PositionServiceProvider } from '@shared/contexts/PositionServiceContext';
import { configureStore } from '@shared/store/storeConfig';
import { createServerPositionService } from '@shared/services/database/serverPositionService';

// Configure store dependencies once at app initialization
// This happens before any component renders
if (typeof window !== 'undefined') {
  const positionService = createServerPositionService();
  configureStore({ positionService });
}

// Inner component that has access to zustand store
function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { engineStatus } = useTraining();

  useEffect(() => {
    // Update app-ready based on router state
    // Don't wait for engine initially as it may not be initialized on all pages
    if (typeof document !== 'undefined') {
      let appReadyState: 'true' | 'false' | 'error';
      
      if (!router.isReady) {
        appReadyState = 'false';
      } else {
        // Router is ready, check if we're on a training page that needs engine
        const isTrainingPage = router.pathname.includes('/train/');
        
        if (isTrainingPage && engineStatus === 'initializing') {
          appReadyState = 'false';
        } else if (isTrainingPage && engineStatus === 'error') {
          appReadyState = 'error';
        } else {
          // Router ready and either not training page or engine ready
          appReadyState = 'true';
        }
      }
      
      // Log state transitions for debugging
      const currentState = document.body.getAttribute('data-app-ready');
      if (currentState !== appReadyState) {
        console.log(`[_app] App ready state transition: ${currentState} → ${appReadyState}`, {
          router: { isReady: router.isReady, pathname: router.pathname },
          engineStatus
        });
      }
      
      document.body.setAttribute('data-app-ready', appReadyState);
    }
  }, [router.isReady, router.pathname, engineStatus]);

  useEffect(() => {
    // Reset ready state on route changes
    const handleRouteChangeStart = () => {
      if (typeof document !== 'undefined') {
        document.body.setAttribute('data-app-ready', 'false');
      }
    };

    const handleRouteChangeComplete = () => {
      // Re-evaluate ready state after route change
      if (typeof document !== 'undefined' && router.isReady && engineStatus === 'ready') {
        document.body.setAttribute('data-app-ready', 'true');
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events, router.isReady, engineStatus]);

  // Initialize TestBridge for E2E tests
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_IS_E2E_TEST === 'true' && typeof window !== 'undefined') {
      import('@shared/services/chess/EngineService')
        .then(({ EngineService }) => {
          import('@shared/services/test/TestBridge')
            .then(({ TestBridgeImpl }) => {
              // Get the singleton engine instance
              const engine = EngineService.getInstance();
              // Initialize TestBridge with the engine
              (window as any).__E2E_TEST_BRIDGE__ = new TestBridgeImpl(engine as any);
              
              // Signal that the bridge is ready for tests
              document.body.setAttribute('data-bridge-status', 'ready');
              document.body.setAttribute('data-app-ready', 'true');
              console.log('[E2E] Test Bridge initialized and ready');
            })
            .catch(err => {
              console.error('[E2E] Failed to load TestBridge:', err);
            });
        })
        .catch(err => {
          console.error('[E2E] Failed to load EngineService:', err);
        });
    }
  }, []);

  return <Component {...pageProps} />;
}

function MyApp(props: AppProps) {
  // Wrap app with PositionServiceProvider for dependency injection
  return (
    <PositionServiceProvider>
      <AppContent {...props} />
    </PositionServiceProvider>
  );
}

export default MyApp; 