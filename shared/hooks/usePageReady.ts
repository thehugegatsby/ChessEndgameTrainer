import { useState, useEffect } from 'react';

/**
 * Custom hook for managing page ready state in E2E tests
 * Provides a consistent way to signal when a page/component is fully loaded
 * 
 * @param dependencies - Array of boolean conditions that must all be true
 * @returns boolean indicating if the page is ready
 */
export function usePageReady(dependencies: boolean[] = []): boolean {
  const [isPageReady, setIsPageReady] = useState(false);
  
  useEffect(() => {
    // Check if all dependencies are true
    const allReady = dependencies.length === 0 || dependencies.every(dep => dep === true);
    
    if (allReady && !isPageReady) {
      setIsPageReady(true);
      
      // Optional: Emit custom event for debugging
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_E2E_SIGNALS === 'true') {
        window.dispatchEvent(new CustomEvent('page-ready', {
          detail: { timestamp: Date.now() }
        }));
      }
    }
  }, dependencies);
  
  return isPageReady;
}

/**
 * Hook for components to signal their ready state
 * More granular than page-ready, used for specific component readiness
 * 
 * @param isReady - Boolean indicating if the component is ready
 * @returns The same boolean for convenience
 */
export function useComponentReady(isReady: boolean): boolean {
  useEffect(() => {
    if (isReady && typeof window !== 'undefined' && process.env.NEXT_PUBLIC_E2E_SIGNALS === 'true') {
      window.dispatchEvent(new CustomEvent('component-ready', {
        detail: { 
          timestamp: Date.now(),
          component: new Error().stack?.split('\n')[2]?.trim() // Capture calling component for debugging
        }
      }));
    }
  }, [isReady]);
  
  return isReady;
}