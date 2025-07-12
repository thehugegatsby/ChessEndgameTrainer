/**
 * @fileoverview MovePanelPOM - Page Object Model for Move Navigation Panel
 * @description Encapsulates all move navigation and state management functionality
 * Implements smart navigation strategies and test bridge optimizations
 */

import { Page } from '@playwright/test';
import { IMovePanelPOM, Move, NavigationState } from '../interfaces';
import { MoveListComponent } from './MoveListComponent';
import { NavigationControls } from './NavigationControls';
import { ILogger } from '../../../shared/services/logging/types';
import { TIMEOUTS } from '../config/constants';
import { NavigationError, InvalidMoveError } from './errors';

/**
 * Configuration options for MovePanelPOM
 */
export interface MovePanelConfig {
  timeouts?: {
    default: number;
    navigation: number;
  };
  testBridge?: {
    isAvailable: () => Promise<boolean>;
    setMoveIndex: (index: number) => Promise<void>;
  };
  performanceMetrics?: boolean;
}

/**
 * Page Object Model for Move Panel functionality
 * Encapsulates move list and navigation controls
 */
export class MovePanelPOM implements IMovePanelPOM {
  private _moveList: MoveListComponent | null = null;
  private _navigationControls: NavigationControls | null = null;
  private _disposed = false;
  
  constructor(
    private readonly page: Page,
    private readonly logger: ILogger,
    private readonly config: MovePanelConfig = {}
  ) {
    this.config.timeouts = {
      default: TIMEOUTS.default,
      navigation: TIMEOUTS.navigation,
      ...this.config.timeouts
    };
  }
  
  /**
   * Lazy-loaded MoveListComponent
   */
  private get moveList(): MoveListComponent {
    this.ensureNotDisposed();
    if (!this._moveList) {
      this._moveList = new MoveListComponent(this.page);
      this.logger.info('[MovePanelPOM] MoveListComponent initialized');
    }
    return this._moveList;
  }
  
  /**
   * Lazy-loaded NavigationControls
   */
  private get navigationControls(): NavigationControls {
    this.ensureNotDisposed();
    if (!this._navigationControls) {
      this._navigationControls = new NavigationControls(this.page);
      this.logger.info('[MovePanelPOM] NavigationControls initialized');
    }
    return this._navigationControls;
  }
  
  /**
   * Navigate to a specific move by index
   * Uses smart navigation strategy based on distance
   */
  async gotoMove(moveNumber: number): Promise<void> {
    const startTime = Date.now();
    this.logger.info(`[MovePanelPOM] Navigating to move ${moveNumber}`);
    
    try {
      const currentIndex = await this.getCurrentMoveIndex();
      const totalMoves = await this.getTotalMoves();
      
      // Validate move number
      if (moveNumber < 0 || moveNumber >= totalMoves) {
        throw new InvalidMoveError(moveNumber, totalMoves);
      }
      
      // Skip if already at target
      if (currentIndex === moveNumber) {
        this.logger.debug(`[MovePanelPOM] Already at move ${moveNumber}`);
        return;
      }
      
      // Try test bridge optimization first
      if (this.config.testBridge?.isAvailable && await this.config.testBridge.isAvailable()) {
        try {
          await this.config.testBridge.setMoveIndex(moveNumber);
          await this.waitForMoveIndex(moveNumber);
          this.logPerformance('gotoMove.bridge', startTime);
          return;
        } catch (error) {
          this.logger.warn('[MovePanelPOM] Test bridge navigation failed, falling back to UI', error);
        }
      }
      
      // UI navigation strategy
      await this.navigateViaUI(moveNumber, currentIndex, totalMoves);
      await this.waitForMoveIndex(moveNumber);
      
      this.logPerformance('gotoMove.ui', startTime);
      
    } catch (error) {
      this.logger.error(`[MovePanelPOM] Navigation to move ${moveNumber} failed`, error);
      throw error;
    }
  }
  
  /**
   * Smart UI navigation based on distance and position
   */
  private async navigateViaUI(targetIndex: number, currentIndex: number, totalMoves: number): Promise<void> {
    // Special cases: start and end
    if (targetIndex === 0) {
      await this.navigationControls.goToStart();
      return;
    }
    
    if (targetIndex === totalMoves - 1) {
      await this.navigationControls.goToEnd();
      return;
    }
    
    // Calculate optimal navigation method
    const distance = Math.abs(targetIndex - currentIndex);
    
    // For large jumps, use direct click
    if (distance > 5) {
      try {
        await this.moveList.clickMove(targetIndex);
        return;
      } catch (error) {
        this.logger.warn('[MovePanelPOM] Direct move click failed, using step navigation', error);
      }
    }
    
    // Step navigation for short distances
    const isForward = targetIndex > currentIndex;
    for (let i = 0; i < distance; i++) {
      if (isForward) {
        await this.navigationControls.goForward();
      } else {
        await this.navigationControls.goBack();
      }
      
      // Small delay between steps to ensure UI updates
      await this.page.waitForTimeout(50);
    }
  }
  
  /**
   * Wait for move index to update
   */
  private async waitForMoveIndex(expectedIndex: number): Promise<void> {
    await this.page.waitForFunction(
      async (expected) => {
        // This runs in browser context, need to check actual UI state
        const moveButtons = document.querySelectorAll('[data-testid^="move-"]');
        const activeButton = document.querySelector('[data-testid^="move-"][data-active="true"]');
        if (!activeButton) return false;
        
        const activeIndex = parseInt(activeButton.getAttribute('data-testid')?.split('-')[1] || '-1');
        return activeIndex === expected;
      },
      expectedIndex,
      { timeout: this.config.timeouts?.navigation }
    );
  }
  
  // Navigation actions
  async goToStart(): Promise<void> {
    this.logger.info('[MovePanelPOM] Navigating to start');
    await this.navigationControls.goToStart();
  }
  
  async goToEnd(): Promise<void> {
    this.logger.info('[MovePanelPOM] Navigating to end');
    await this.navigationControls.goToEnd();
  }
  
  async goBack(): Promise<void> {
    this.logger.debug('[MovePanelPOM] Going back one move');
    await this.navigationControls.goBack();
  }
  
  async goForward(): Promise<void> {
    this.logger.debug('[MovePanelPOM] Going forward one move');
    await this.navigationControls.goForward();
  }
  
  // State queries
  async getMoves(): Promise<Move[]> {
    const moves = await this.moveList.getMoves();
    // Convert move format from MoveListComponent to IMovePanelPOM format
    return moves.map(move => ({
      san: move.san,
      moveNumber: move.moveNumber,
      color: move.color === 'white' ? 'w' : 'b' as 'w' | 'b'
    }));
  }
  
  async getMoveCount(): Promise<number> {
    return await this.moveList.getMoveCount();
  }
  
  async getCurrentMoveIndex(): Promise<number> {
    return await this.navigationControls.getCurrentMoveIndex();
  }
  
  async getTotalMoves(): Promise<number> {
    return await this.navigationControls.getTotalMoves();
  }
  
  async getNavigationState(): Promise<NavigationState> {
    const state = await this.navigationControls.getNavigationState();
    // Convert navigation state format
    return {
      isAtStart: state.isAtStart,
      isAtEnd: state.isAtEnd,
      canGoBack: state.isBackEnabled,
      canGoForward: state.isForwardEnabled
    };
  }
  
  // UI interactions
  async clickMove(moveIndex: number): Promise<void> {
    this.logger.info(`[MovePanelPOM] Clicking move ${moveIndex}`);
    await this.moveList.clickMove(moveIndex);
  }
  
  async waitForMoveCount(expectedCount: number): Promise<void> {
    this.logger.debug(`[MovePanelPOM] Waiting for move count: ${expectedCount}`);
    await this.moveList.waitForMoveCount(expectedCount);
  }
  
  /**
   * Dispose resources (optional, for future extensions)
   */
  async dispose(): Promise<void> {
    if (this._disposed) return;
    
    this.logger.debug('[MovePanelPOM] Disposing resources');
    this._disposed = true;
    
    // Currently no resources to clean up, but available for future use
    // e.g., removing event listeners, clearing caches, etc.
  }
  
  /**
   * Ensure component is not disposed
   */
  private ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error('MovePanelPOM has been disposed');
    }
  }
  
  /**
   * Log performance metrics if enabled
   */
  private logPerformance(operation: string, startTime: number): void {
    if (this.config.performanceMetrics) {
      const duration = Date.now() - startTime;
      this.logger.info(`[MovePanelPOM] Performance: ${operation} took ${duration}ms`);
    }
  }
}