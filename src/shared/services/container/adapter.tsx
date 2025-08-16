/**
 * Unified Service Container Adapter
 * Single, focused adapter for React integration
 */

'use client';

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ServiceContainer as DefaultServiceContainer } from './ServiceContainer';
import { type ServiceContainerType as ServiceContainer, type ServiceRegistry } from './index';

/**
 * Context for ServiceContainer
 */
const ServiceContainerContext = createContext<ServiceContainer | undefined>(undefined);

/**
 * Provider props
 */
interface ServiceProviderProps {
  children: ReactNode;
  /**
   * Container instance (if not provided, creates production container)
   */
  container?: ServiceContainer;
}

/**
 * Service Provider - Single point of integration
 */
export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children, container }) => {
  const serviceContainer = useMemo(() => {
    return container || DefaultServiceContainer.createProductionContainer();
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
export const useServiceContainer = (): ServiceContainer => {
  const container = useContext(ServiceContainerContext);
  if (!container) {
    throw new Error('useServiceContainer must be used within ServiceProvider');
  }
  return container;
};

/**
 * Hook to get a specific service
 */
export const useService = <K extends keyof ServiceRegistry>(key: K): ServiceRegistry[K] => {
  const container = useServiceContainer();
  return container.resolve(key);
};

/**
 * Hook shortcuts for common services
 */
export const usePlatformStorage = (): ServiceRegistry['platform.storage'] =>
  useService('platform.storage');
export const usePlatformDevice = (): ServiceRegistry['platform.device'] =>
  useService('platform.device');
export const usePlatformNotifications = (): ServiceRegistry['platform.notifications'] =>
  useService('platform.notifications');

/**
 * Hook for localStorage (the main Jest 30 fix)
 */
export const useLocalStorage = (): Storage => {
  const container = useServiceContainer();
  return container.resolveCustom<Storage>('browser.localStorage');
};

/**
 * Factory function for backward compatibility
 * Replaces the original getPlatformService()
 */
let globalContainer: ServiceContainer | null = null;

export function getPlatformService(): unknown {
  if (!globalContainer) {
    globalContainer = DefaultServiceContainer.createProductionContainer() as ServiceContainer;
  }

  // Return platform service object - will be properly typed when services are registered
  if (!globalContainer) {
    throw new Error('Platform service container not initialized');
  }
  return globalContainer.resolveCustom('platform.service');
}

/**
 * Reset global container (for testing)
 */
export function resetPlatformService(): void {
  globalContainer = null;
}
