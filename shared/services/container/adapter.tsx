/**
 * Unified Service Container Adapter
 * Single, focused adapter for React integration
 */

'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ServiceContainer, IServiceContainer, ServiceRegistry } from './index';

/**
 * Context for ServiceContainer
 */
const ServiceContainerContext = createContext<IServiceContainer | undefined>(undefined);

/**
 * Provider props
 */
interface ServiceProviderProps {
  children: ReactNode;
  /**
   * Container instance (if not provided, creates production container)
   */
  container?: IServiceContainer;
}

/**
 * Service Provider - Single point of integration
 */
export const ServiceProvider: React.FC<ServiceProviderProps> = ({
  children,
  container
}) => {
  const serviceContainer = useMemo(() => {
    return container || ServiceContainer.createProductionContainer();
  }, [container]);

  return (
    <ServiceContainerContext.Provider value={serviceContainer}>
      {children}
    </ServiceContainerContext.Provider>
  );
};

/**
 * Hook to get the container
 */
export const useServiceContainer = (): IServiceContainer => {
  const container = useContext(ServiceContainerContext);
  if (!container) {
    throw new Error('useServiceContainer must be used within ServiceProvider');
  }
  return container;
};

/**
 * Hook to get a specific service
 */
export const useService = <K extends keyof ServiceRegistry>(
  key: K
): ServiceRegistry[K] => {
  const container = useServiceContainer();
  return container.resolve(key);
};

/**
 * Hook shortcuts for common services
 */
export const usePlatformStorage = () => useService('platform.storage');
export const usePlatformDevice = () => useService('platform.device');
export const usePlatformNotifications = () => useService('platform.notifications');

/**
 * Hook for localStorage (the main Jest 30 fix)
 */
export const useLocalStorage = () => {
  const container = useServiceContainer();
  return container.resolveCustom<Storage>('browser.localStorage');
};

/**
 * Factory function for backward compatibility
 * Replaces the original getPlatformService()
 */
let globalContainer: IServiceContainer | null = null;

export function getPlatformService() {
  if (!globalContainer) {
    globalContainer = ServiceContainer.createProductionContainer();
  }
  
  // Return platform service object - will be properly typed when services are registered
  return globalContainer.resolveCustom('platform.service');
}

/**
 * Reset global container (for testing)
 */
export function resetPlatformService(): void {
  globalContainer = null;
}