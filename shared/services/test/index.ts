/**
 * @fileoverview Test Service exports
 * @version 1.0.0
 */

export { TestApiService, getTestApi } from './TestApiService';
export type { 
  TestMoveResponse, 
  TestGameState, 
  TestEngineConfig 
} from './TestApiService';

// Only export browser API in browser environment
export { BrowserTestApi } from './BrowserTestApi';