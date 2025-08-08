/**
 * Service Container Module
 * Simplified, focused DI for Jest 30 localStorage migration
 */

// Core container
export { ServiceContainer } from "./ServiceContainer";

// Types
export type {
  IServiceContainer,
  ServiceRegistry,
  ServiceFactory,
  ServiceKey,
  ServiceOverrides,
  ServiceContainerConfig,
  IBrowserAPIs,
} from "./types";

// Errors
export {
  ServiceNotFoundError,
  ServiceAlreadyRegisteredError,
  CircularDependencyError,
} from "./types";

// Mocks for testing
export {
  createMockStorage,
  createMockNavigator,
  createMockWindow,
  createMockDocument,
  createMockPerformance,
} from "./mocks";

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
} from "./adapter";
