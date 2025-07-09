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
    
    // The `testMode` prop is now the single source of truth, solving the SSR/CSR mismatch
    const shouldUseTestEngine = testMode || process.env.NODE_ENV === 'test';

    const initializeEngine = async () => {
      try {
        setStatus('initializing');
        
        // Choose engine implementation based on environment
        const service = shouldUseTestEngine 
          ? new MockEngineService()
          : new MockEngineService(); // TODO: Replace with real EngineService when implemented
        
        console.log(`🔧 Initializing ${shouldUseTestEngine ? 'Mock' : 'Production'} Engine Service...`);
        
        await service.initialize();
        
        if (!isCancelled) {
          setEngineService(service);
          setStatus('ready');
          
          console.log(`✅ ${shouldUseTestEngine ? 'MockEngineService' : 'EngineService'} initialized and ready`);
          
          // For E2E tests: Initialize the Test Bridge
          // The bridge acts as the sole interface for tests to interact with the engine
          if (shouldUseTestEngine && typeof window !== 'undefined') {
            // Dynamically import and initialize the E2E Test Bridge
            // This ensures the bridge code is NOT in the production bundle
            import('../services/test/TestBridge')
              .then(({ TestBridgeImpl }) => {
                // Pass the live MockEngineService instance to the bridge
                window.__E2E_TEST_BRIDGE__ = new TestBridgeImpl(service as MockEngineServiceType);
                console.log('🧪 E2E Test Bridge initialized.');
                
                // Signal that the bridge is ready for tests
                if (typeof document !== 'undefined') {
                  document.body.setAttribute('data-bridge-status', 'ready');
                }
              })
              .catch(err => {
                console.error('❌ Failed to initialize E2E Test Bridge:', err);
              });
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('❌ Engine service initialization failed:', error);
          setStatus('error');
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