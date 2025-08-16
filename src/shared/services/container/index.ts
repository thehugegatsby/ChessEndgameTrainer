/**
 * Service Container Module
 * Simplified, focused DI for Jest 30 localStorage migration
 */

// Types
export type {
  ServiceContainer as ServiceContainerType,
  ServiceRegistry,
  ServiceFactory,
  ServiceKey,
  ServiceOverrides,
  ServiceContainerConfig,
  BrowserAPIs,
} from './types';

// Errors
export {
  ServiceNotFoundError,
  ServiceAlreadyRegisteredError,
  CircularDependencyError,
} from './types';

// Mocks for testing
export {
  createMockStorage,
  createMockNavigator,
  createMockWindow,
  createMockDocument,
  createMockPerformance,
} from './mocks';

// Implementation
export { ServiceContainer } from './ServiceContainer';

// React integration
export {
  ServiceProvider,
  useServiceContainer,
  useService,
  usePlatformStorage,
  usePlatformDevice,
  usePlatformNotifications,
  useLocalStorage,
  getPlatformService,
  resetPlatformService,
} from './adapter';
