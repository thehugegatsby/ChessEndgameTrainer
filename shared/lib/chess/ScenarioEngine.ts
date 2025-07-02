/**
 * @fileoverview Legacy ScenarioEngine - Re-export for backward compatibility
 * @version 2.0.0
 * @description Clean re-export to prevent duplicate export conflicts
 * 
 * IMPORTANT: This file now re-exports the new modular ScenarioEngine
 * All functionality has been moved to ./ScenarioEngine/index.ts
 */

// Re-export the new modular implementation for backward compatibility
export { ScenarioEngine } from './ScenarioEngine/index';

// Re-export types from the modular implementation
export type { 
  DualEvaluation,
  TablebaseInfo,
  EngineEvaluation
} from './ScenarioEngine/types'; 