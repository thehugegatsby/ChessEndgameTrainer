/**
 * Strangler Facade Pattern Implementation
 * 
 * This component demonstrates how to use feature flags to switch between
 * legacy and new implementations during migration.
 */

import React from 'react';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { type FeatureFlag } from '../services/FeatureFlagService';

interface StranglerFacadeProps<T> {
  flag: FeatureFlag;
  legacyComponent: React.ComponentType<T>;
  newComponent: React.ComponentType<T>;
  componentProps: T;
  fallbackToLegacy?: boolean;
}

/**
 * Generic Strangler Facade for switching between legacy and new components
 */
export function StranglerFacade<T extends Record<string, unknown>>({
  flag,
  legacyComponent: LegacyComponent,
  newComponent: NewComponent,
  componentProps,
  fallbackToLegacy = true,
}: StranglerFacadeProps<T>): React.ReactElement | null {
  const useNewImplementation = useFeatureFlag(flag);

  // Error boundary for new implementation
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [useNewImplementation]);


  // Render LegacyComponent outside ErrorBoundary when error occurred
  if (hasError) {
    if (fallbackToLegacy) {
      console.error(`New implementation failed for ${flag}, falling back to legacy`);
      return <LegacyComponent {...componentProps} />;
    }
    return null;
  }

  if (useNewImplementation) {
    return (
      <ErrorBoundary onError={() => setHasError(true)} fallbackToLegacy={fallbackToLegacy}>
        <NewComponent {...componentProps} />
      </ErrorBoundary>
    );
  }

  return <LegacyComponent {...componentProps} />;
}

/**
 * Error boundary that immediately notifies parent without managing its own error state
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void; fallbackToLegacy: boolean },
  { hasError: boolean }
> {
  private hasNotifiedParent = false;

  constructor(props: { children: React.ReactNode; onError: () => void; fallbackToLegacy: boolean }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error in new implementation:', error, errorInfo);
    
    // Notify parent immediately and only once
    if (!this.hasNotifiedParent) {
      this.hasNotifiedParent = true;
      // Use setTimeout to break out of the React render cycle
      setTimeout(() => {
        this.props.onError();
      }, 0);
    }
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      // Return empty fragment - parent will handle the fallback
      return <></>;
    }
    return this.props.children;
  }
}

/**
 * Example usage for services (non-React)
 * Note: Import featureFlags directly in the module using this function
 * to avoid circular dependencies
 */
export function createServiceFacade<T extends Record<string, unknown>>(
  flag: FeatureFlag,
  legacyService: T,
  newService: T,
  flagChecker: (flag: FeatureFlag) => boolean
): T {
  return new Proxy({} as T, {
    get(_, prop: string | symbol) {
      const service = flagChecker(flag) ? newService : legacyService;
      const value = (service as Record<string | symbol, unknown>)[prop];
      
      if (typeof value === 'function') {
        return value.bind(service);
      }
      
      return value;
    },
  });
}