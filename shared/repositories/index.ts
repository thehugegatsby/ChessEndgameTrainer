/**
 * Repository exports
 * Central export point for all repository interfaces and implementations
 */

// Interfaces
export type {
  IPositionRepository,
  IPositionRepositoryConfig,
  IPositionRepositoryEvents,
} from "./IPositionRepository";

// Implementations
export { FirebasePositionRepository } from "./implementations/FirebasePositionRepository";
export { MockPositionRepository } from "./implementations/MockPositionRepository";

// Future implementations can be added here:
// export { APIPositionRepository } from './implementations/APIPositionRepository';
// export { LocalStoragePositionRepository } from './implementations/LocalStoragePositionRepository';
// export { GraphQLPositionRepository } from './implementations/GraphQLPositionRepository';
