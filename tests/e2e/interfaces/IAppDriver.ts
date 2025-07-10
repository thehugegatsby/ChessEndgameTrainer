/**
 * @fileoverview IAppDriver Interface - Contract for E2E Test Orchestrator
 * @description Defines the public API for the AppDriver orchestrator
 * Follows Fluent Interface pattern for method chaining
 */

import { GameState } from '../components/AppDriver';
import { IBoardComponent } from './IBoardComponent';
import { IMovePanelPOM } from './IMovePanelPOM';
import { IEvaluationPanel } from './IEvaluationPanel';

/**
 * Main orchestrator interface for E2E tests
 * Provides high-level test automation methods
 */
export interface IAppDriver {
  // Navigation
  /**
   * Navigate to application page
   * @param path - Optional path to navigate to
   * @returns this for fluent interface
   */
  visit(path?: string): Promise<this>;
  
  /**
   * Reload the current page
   * @returns this for fluent interface
   */
  reload(): Promise<this>;
  
  // Game Management
  /**
   * Setup a new game with optional FEN position
   * @param fen - Optional FEN string (default: starting position)
   * @returns this for fluent interface
   */
  setupGame(fen?: string): Promise<this>;
  
  /**
   * Reset application state to initial
   * @returns this for fluent interface
   */
  resetState(): Promise<this>;
  
  /**
   * Make a move and wait for UI updates
   * @param from - Source square
   * @param to - Target square
   * @returns this for fluent interface
   */
  makeMoveAndAwaitUpdate(from: string, to: string): Promise<this>;
  
  // State Queries
  /**
   * Get complete game state from all components
   * @returns Current game state
   */
  getFullGameState(): Promise<GameState>;
  
  /**
   * Check if test bridge is available
   * @returns True if test bridge is available
   */
  isTestBridgeAvailable(): Promise<boolean>;
  
  // Component Access
  /**
   * Access to board component
   */
  readonly board: IBoardComponent;
  
  /**
   * Access to move panel component
   */
  readonly movePanel: IMovePanelPOM;
  
  /**
   * Access to evaluation panel component
   */
  readonly evaluationPanel: IEvaluationPanel;
  
  // Deprecated - Migration phase
  /**
   * @deprecated Use .movePanel instead. Will be removed in v2.0
   */
  readonly moveList?: any;
  
  /**
   * @deprecated Use .movePanel instead. Will be removed in v2.0
   */
  readonly navigationControls?: any;
  
  // Lifecycle
  /**
   * Cleanup and dispose of resources
   */
  dispose(): Promise<void>;
}