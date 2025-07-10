/**
 * @fileoverview Driver dependencies interface for E2E test helpers
 * @description Defines the contract for dependencies shared between test helpers
 */

import { Page } from '@playwright/test';
import { BoardComponent } from '../components/BoardComponent';
import { MoveListComponent } from '../components/MoveListComponent';
import { EvaluationPanel } from '../components/EvaluationPanel';
import { NavigationControls } from '../components/NavigationControls';
import { ILogger } from '../../../shared/services/logging/types';

/**
 * Core dependencies required by E2E test helpers
 * Uses Interface Segregation Principle - helpers request only what they need
 */
export interface DriverDependencies {
  /** Playwright page object */
  page: Page;
  
  /** Chess board component */
  board: BoardComponent;
  
  /** Move list component */
  moveList: MoveListComponent;
  
  /** Engine evaluation panel */
  evaluationPanel: EvaluationPanel;
  
  /** Navigation controls */
  navigationControls: NavigationControls;
  
  /** Logger instance */
  logger: ILogger;
  
  /** Error handler for consistent error management */
  errorHandler: (context: string, error: Error) => Promise<void>;
  
  /** Test configuration - structured for clarity */
  config: {
    baseUrl: string;
    timeouts: {
      default: number;
      navigation: number;
      waitForSelector: number;
      engineResponse: number;
    };
    retries: {
      defaultAttempts: number;
      delayMs: number;
      backoffFactor: number;
    };
    verbose: boolean;
    autoWaitForEngine: boolean;
  };
}

/**
 * Partial dependencies for helpers that don't need everything
 * Example: GamePlayer only needs board, moveList, and logger
 */
export type GamePlayerDependencies = Pick<
  DriverDependencies, 
  'board' | 'moveList' | 'logger' | 'page' | 'errorHandler' | 'config'
>;

export type PuzzleSolverDependencies = Pick<
  DriverDependencies,
  'board' | 'evaluationPanel' | 'logger' | 'page' | 'config' | 'errorHandler'
>;

export type EngineAnalyzerDependencies = Pick<
  DriverDependencies,
  'evaluationPanel' | 'logger' | 'page' | 'config' | 'errorHandler'
>;