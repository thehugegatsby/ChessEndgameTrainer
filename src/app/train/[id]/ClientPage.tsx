'use client';

import React, { lazy, Suspense } from 'react';
import { StoreProvider } from '@shared/store/StoreContext';
import type { RootState } from '@shared/store/slices/types';

// Lazy load the main training page (React.memo optimized)
const EndgameTrainingPage = lazy(() =>
  import('@shared/pages/EndgameTrainingPage').then(module => ({
    default: module.EndgameTrainingPage,
  }))
);

// Loading component
const LoadingScreen = (): React.JSX.Element => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Lade Training...
      </h2>
      <p className="text-gray-500 dark:text-gray-400">Bereite Endspielposition vor</p>
    </div>
  </div>
);

interface ClientPageProps {
  initialState: Partial<RootState>;
}

/**
 * Client-side wrapper for the training page
 * Handles lazy loading and suspense boundaries
 */
export default function ClientPage({ initialState }: ClientPageProps): React.JSX.Element {
  return (
    <StoreProvider initialState={initialState}>
      <Suspense fallback={<LoadingScreen />}>
        <EndgameTrainingPage />
      </Suspense>
    </StoreProvider>
  );
}
