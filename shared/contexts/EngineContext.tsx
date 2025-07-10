/**
 * @fileoverview Engine Context - React DI for Engine Service
 * @version 1.0.0
 * @description Provides robust dependency injection for engine services.
 * Eliminates race conditions and provides clean separation between
 * production and test environments.
 * 
 * ARCHITECTURE BENEFITS:
 * - No race conditions: Components wait for engine initialization
 * - Clean DI: Production vs Test engine selection at composition root
 * - Type Safety: Hooks ensure engine is available when used
 * - Lifecycle Management: Proper initialization and cleanup
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { IEngineService } from '../services/engine/IEngineService';
import { MockEngineService } from '../services/engine/MockEngineService';
import type { MockEngineService as MockEngineServiceType } from '../services/engine/MockEngineService';

/**
 * Engine Context shape - provides both service and status
 */
interface IEngineContext {
  service: IEngineService | null;
  status: EngineProviderStatus;
}

/**
 * Engine Context - holds the initialized engine service and status
 */
export const EngineContext = createContext<IEngineContext>({
  service: null,
  status: 'initializing'
});

/**
 * Custom hook to access the engine service
 * Throws error if used outside provider or before ready - ensures proper usage
 */
export const useEngineService = (): IEngineService => {
  const { service } = useContext(EngineContext);
  if (!service) {
    throw new Error('useEngineService must be used when engine status is "ready"');
  }
  return service;
};

/**
 * Engine initialization status
 */
export type EngineProviderStatus = 'initializing' | 'ready' | 'error';

/**
 * Engine Provider Props
 */
interface EngineProviderProps {
  children: React.ReactNode;
  testMode?: boolean; // Allow manual override for testing
}

/**
 * Engine Provider Component
 * Manages engine service lifecycle and provides it to the component tree
 */
export const EngineProvider: React.FC<EngineProviderProps> = ({ 
  children, 
  testMode 
}) => {
  const [engineService, setEngineService] = useState<IEngineService | null>(null);
  const [status, setStatus] = useState<EngineProviderStatus>('initializing');

  useEffect(() => {
    let isCancelled = false;
    
    // Check for E2E test mode via window flag (optimal client-side approach)
    // Fallback to prop for backward compatibility and manual testing
    const isE2ETestMode = typeof window !== 'undefined' && (window as any).__E2E_TEST_MODE__;
    const shouldUseTestEngine = isE2ETestMode || testMode || process.env.NODE_ENV === 'test';

    const initializeEngine = async () => {
      try {
        console.log('[EngineProvider] 🚀 Starting engine initialization...');
        console.log(`[EngineProvider] Test mode detection: E2E=${isE2ETestMode}, prop=${testMode}, NODE_ENV=${process.env.NODE_ENV}`);
        
        setStatus('initializing');
        
        // Choose engine implementation based on environment
        const service = shouldUseTestEngine 
          ? new MockEngineService()
          : new MockEngineService(); // TODO: Replace with real EngineService when implemented
        
        console.log(`[EngineProvider] 🔧 Creating ${shouldUseTestEngine ? 'Mock' : 'Production'} Engine Service...`);
        
        console.log('[EngineProvider] 📞 Calling service.initialize()...');
        await service.initialize();
        console.log('[EngineProvider] ✅ service.initialize() completed');
        
        if (!isCancelled) {
          console.log('[EngineProvider] 🔄 Setting engine service state...');
          setEngineService(service);
          setStatus('ready');
          console.log('[EngineProvider] 🎯 Engine status set to READY');
          
          console.log(`[EngineProvider] ✅ ${shouldUseTestEngine ? 'MockEngineService' : 'EngineService'} initialization COMPLETE`);
          
          // For E2E tests: Initialize the Test Bridge
          if (shouldUseTestEngine && typeof window !== 'undefined') {
            console.log('[EngineProvider] 🧪 Initializing Test Bridge...');
            // Dynamically import and initialize the E2E Test Bridge
            import('../services/test/TestBridge')
              .then(({ TestBridgeImpl }) => {
                console.log('[EngineProvider] 🔗 Creating Test Bridge instance...');
                window.__E2E_TEST_BRIDGE__ = new TestBridgeImpl(service as MockEngineServiceType);
                console.log('[EngineProvider] ✅ E2E Test Bridge initialized and attached to window');
                
                // Signal that the bridge is ready for tests
                if (typeof document !== 'undefined') {
                  document.body.setAttribute('data-bridge-status', 'ready');
                  console.log('[EngineProvider] 🏁 data-bridge-status="ready" set on body');
                }
              })
              .catch(err => {
                console.error('[EngineProvider] ❌ FAILED to initialize E2E Test Bridge:', err);
              });
          }
          
          // CRITICAL: Set app-ready signal for tests
          if (typeof document !== 'undefined') {
            document.body.setAttribute('data-app-ready', 'true');
            console.log('[EngineProvider] 🎉 data-app-ready="true" set - APP IS READY!');
          }
        }
      } catch (error) {
        console.error('[EngineProvider] 💥 FATAL: Engine service initialization failed:', error);
        if (!isCancelled) {
          setStatus('error');
          // Signal error state
          if (typeof document !== 'undefined') {
            document.body.setAttribute('data-app-ready', 'error');
          }
        }
      }
    };

    initializeEngine();

    // Cleanup function
    return () => {
      isCancelled = true;
      if (engineService) {
        engineService.shutdown().catch(error => {
          console.error('Engine shutdown error:', error);
        });
      }
    };
  }, [testMode]); // Re-initialize if test mode prop changes

  // Update body attribute for E2E test synchronization
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-engine-status', status);
    }
  }, [status]);

  // Show loading or error states
  if (status === 'initializing') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Chess Engine...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Engine Initialization Failed</h2>
          <p className="text-gray-600">Please refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  // Engine is ready - provide both service and status to children
  return (
    <EngineContext.Provider value={{ service: engineService, status }}>
      {children}
    </EngineContext.Provider>
  );
};

/**
 * Custom hook to get engine status for components that need it
 * Now properly distinguishes between initializing, ready, and error states
 */
export const useEngineStatus = (): EngineProviderStatus => {
  const { status } = useContext(EngineContext);
  return status;
};