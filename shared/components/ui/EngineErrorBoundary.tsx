/**
 * Specialized Error Boundary for Chess Engine Components
 * Provides engine-specific error handling and recovery
 */

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { EngineService } from '@shared/services/chess/EngineService';

interface EngineErrorBoundaryProps {
  children: React.ReactNode;
}

export const EngineErrorBoundary: React.FC<EngineErrorBoundaryProps> = ({ 
  children
}) => {
  const handleEngineError = async (error: Error) => {
    
    // Try to cleanup and restart engine
    try {
      const engineService = EngineService.getInstance();
      await engineService.terminate();
    } catch (cleanupError) {
    }
  };

  const engineErrorFallback = (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Chess Engine Error
          </h3>
        </div>
      </div>
      
      <div className="text-sm text-amber-700 dark:text-amber-400 mb-4">
        The chess engine encountered an error and has been restarted. You can continue playing, but some features may be temporarily unavailable.
      </div>
      
      <div className="text-xs text-amber-600 dark:text-amber-500">
        <strong>What you can do:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Try making a move to restart the engine</li>
          <li>Refresh the page if the problem persists</li>
          <li>Check your internet connection for tablebase features</li>
        </ul>
      </div>
    </div>
  );

  return (
    <ErrorBoundary 
      fallback={engineErrorFallback}
      onError={handleEngineError}
    >
      {children}
    </ErrorBoundary>
  );
};