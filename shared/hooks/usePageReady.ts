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

