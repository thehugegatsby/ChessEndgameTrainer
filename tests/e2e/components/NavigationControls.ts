/**
 * @fileoverview NavigationControls Component Object
 * @description Provides comprehensive navigation control for chess game moves
 * Implements hybrid selector strategy with Test Bridge integration
 */

import { Page, Locator } from '@playwright/test';
import { BaseComponent, BaseComponentConfig } from './BaseComponent';
import { 
  SELECTORS, 
  TIMEOUTS, 
  ERROR_MESSAGES, 
  LOG_CONTEXTS,
  NAVIGATION_CONFIG,
  TEST_BRIDGE 
} from '../config/constants';

/**
 * Configuration interface for NavigationControls
 */
export interface NavigationControlsConfig extends BaseComponentConfig {
  /** Enable state synchronization validation after navigation */
  validateStateAfterNavigation?: boolean;
  /** Enable rapid navigation debouncing */
  enableRapidNavigationDebouncing?: boolean;
}

/**
 * Navigation button types supported by the component
 */
export type NavigationButtonType = typeof NAVIGATION_CONFIG.BUTTONS[number];

/**
 * NavigationControls Component Object
 * Manages chess game navigation with robust selector strategy and Test Bridge integration
 */
export class NavigationControls extends BaseComponent {
  private readonly validateStateAfterNavigation: boolean;
  private readonly enableRapidNavigationDebouncing: boolean;
  private lastNavigationTime: number = 0;

  constructor(
    page: Page,
    rootSelector?: string,
    config: NavigationControlsConfig = {}
  ) {
    super(page, rootSelector, config);
    
    this.validateStateAfterNavigation = config.validateStateAfterNavigation ?? NAVIGATION_CONFIG.VALIDATE_STATE_AFTER_NAVIGATION;
    this.enableRapidNavigationDebouncing = config.enableRapidNavigationDebouncing ?? NAVIGATION_CONFIG.DEBOUNCE_RAPID_NAVIGATION;
    
    // Set specific logger context for NavigationControls
    this.logger.setContext(LOG_CONTEXTS.NAVIGATION_CONTROLS);
  }

  /**
   * Default selector for navigation controls container
   */
  getDefaultSelector(): string {
    return '[data-testid="move-navigation"]';
  }

  /**
   * Get navigation button using hybrid selector strategy
   * Implements 4-level fallback chain for maximum robustness
   */
  private async getNavigationButton(buttonType: NavigationButtonType): Promise<Locator> {
    const buttonKey = `GO_TO_${buttonType.toUpperCase()}` as keyof typeof SELECTORS.NAVIGATION_CONTROLS;
    const selectors = SELECTORS.NAVIGATION_CONTROLS[buttonKey];
    
    if (!selectors) {
      throw new Error(ERROR_MESSAGES.NAVIGATION_BUTTON_NOT_FOUND.replace('{button}', buttonType));
    }

    const selectorChain = [
      selectors.PRIMARY,
      selectors.SECONDARY,
      selectors.TERTIARY,
      selectors.FALLBACK
    ];

    return this.findElementWithFallbackChain(selectorChain, TIMEOUTS.navigationAction);
  }

  /**
   * Find element with comprehensive fallback chain
   * Implements progressive fallback strategy with detailed logging
   */
  private async findElementWithFallbackChain(selectors: string[], timeout: number): Promise<Locator> {
    let lastError: Error | null = null;

    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const selectorType = ['primary', 'secondary', 'tertiary', 'fallback'][i];
      
      try {
        const element = this.page.locator(selector);
        await element.waitFor({ timeout: timeout / selectors.length });
        
        if (i > 0) {
          this.log('warn', `Found element with ${selectorType} selector: ${selector}`, { 
            fallbackLevel: i,
            previousSelectors: selectors.slice(0, i)
          });
        } else {
          this.log('info', `Found element with ${selectorType} selector: ${selector}`);
        }
        
        return element;
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `${selectorType} selector failed: ${selector}`, { 
          error: lastError.message,
          selectorLevel: i
        });
      }
    }

    this.log('error', 'All selectors failed in fallback chain', { 
      selectors,
      lastError: lastError?.message
    });
    
    throw new Error(ERROR_MESSAGES.INVALID_SELECTOR
      .replace('{primary}', selectors[0])
      .replace('{fallback}', selectors[selectors.length - 1]));
  }

  /**
   * Check if navigation button is enabled
   * Implements comprehensive disabled state checking
   */
  private async isNavigationButtonEnabled(buttonType: NavigationButtonType): Promise<boolean> {
    try {
      const button = await this.getNavigationButton(buttonType);
      
      // Check multiple disabled attributes for robustness
      for (const attr of NAVIGATION_CONFIG.DISABLED_ATTRIBUTES) {
        const attributeValue = await button.getAttribute(attr);
        if (attributeValue === 'true' || attributeValue === '' || attributeValue === 'disabled') {
          this.log('info', `Navigation button ${buttonType} is disabled`, { 
            disabledAttribute: attr,
            attributeValue 
          });
          return false;
        }
      }
      
      return true;
    } catch (error) {
      this.log('error', `Failed to check if navigation button ${buttonType} is enabled`, { 
        error: (error as Error).message 
      });
      return false;
    }
  }

  /**
   * Handle rapid navigation debouncing
   * Prevents rapid successive navigation clicks that could cause state issues
   */
  private async handleRapidNavigationDebouncing(): Promise<void> {
    if (!this.enableRapidNavigationDebouncing) {
      return;
    }

    const now = Date.now();
    const timeSinceLastNavigation = now - this.lastNavigationTime;
    const minInterval = 1000 / NAVIGATION_CONFIG.RAPID_NAVIGATION_THRESHOLD;

    if (timeSinceLastNavigation < minInterval) {
      const waitTime = minInterval - timeSinceLastNavigation;
      this.log('warn', `Rapid navigation detected, debouncing for ${waitTime}ms`);
      await this.page.waitForTimeout(waitTime);
    }

    this.lastNavigationTime = now;
  }

  /**
   * Wait for Test Bridge engine synchronization
   * Critical for preventing flaky tests by ensuring engine state is updated
   */
  private async waitForEngineSync(): Promise<void> {
    if (!this.validateStateAfterNavigation) {
      return;
    }

    try {
      await this.page.waitForFunction(
        () => {
          // Access constants from global injection in browser context
          const constants = (window as any).__E2E_TEST_CONSTANTS__;
          const bridgeName = constants?.TEST_BRIDGE?.BRIDGE_NAME || '__E2E_TEST_BRIDGE__';
          const bridge = (window as any)[bridgeName];
          return bridge?.engine?.isReady?.() === true;
        },
        { timeout: TIMEOUTS.stateSyncWait }
      );
      
      this.log('info', 'Engine synchronization completed');
    } catch (error) {
      this.log('error', 'Engine synchronization failed', { 
        error: (error as Error).message,
        timeout: TIMEOUTS.stateSyncWait
      });
      throw new Error(ERROR_MESSAGES.NAVIGATION_STATE_SYNC_FAILED.replace('{timeout}', TIMEOUTS.stateSyncWait.toString()));
    }
  }

  /**
   * Wait for move index to reach expected value
   * Ensures navigation has completed before resolving
   */
  private async waitForMoveIndex(expectedIndex: number): Promise<void> {
    if (!this.validateStateAfterNavigation) {
      return;
    }

    try {
      await this.page.waitForFunction(
        (index) => {
          // Access constants from global injection in browser context
          const constants = (window as any).__E2E_TEST_CONSTANTS__;
          const bridgeName = constants?.TEST_BRIDGE?.BRIDGE_NAME || '__E2E_TEST_BRIDGE__';
          const bridge = (window as any)[bridgeName];
          const diagnosticMethod = constants?.TEST_BRIDGE?.DIAGNOSTIC_METHODS?.GET_CURRENT_MOVE_INDEX || 'getCurrentMoveIndex';
          const currentIndex = bridge?.diagnostic?.[diagnosticMethod]?.();
          return currentIndex === index;
        },
        expectedIndex,
        { timeout: TIMEOUTS.stateSyncWait }
      );
      
      this.log('info', `Move index synchronized to ${expectedIndex}`);
    } catch (error) {
      this.log('error', `Move index synchronization failed for index ${expectedIndex}`, { 
        error: (error as Error).message 
      });
      throw new Error(ERROR_MESSAGES.NAVIGATION_STATE_SYNC_FAILED.replace('{timeout}', TIMEOUTS.stateSyncWait.toString()));
    }
  }

  /**
   * Navigate to start position (first move)
   * Implements comprehensive error handling and state synchronization
   */
  async goToStart(): Promise<void> {
    this.log('info', 'Navigating to start position');
    
    await this.handleRapidNavigationDebouncing();
    
    const button = await this.getNavigationButton('start');
    
    if (!await this.isNavigationButtonEnabled('start')) {
      throw new Error(ERROR_MESSAGES.NAVIGATION_DISABLED_BUTTON.replace('{button}', 'start'));
    }
    
    await button.click();
    
    await this.waitForEngineSync();
    await this.waitForMoveIndex(NAVIGATION_CONFIG.BOUNDARY_POSITIONS.START);
    
    this.log('info', 'Successfully navigated to start position');
  }

  /**
   * Navigate back one move
   * Includes boundary condition checking and state validation
   */
  async goBack(): Promise<void> {
    this.log('info', 'Navigating back one move');
    
    await this.handleRapidNavigationDebouncing();
    
    const button = await this.getNavigationButton('back');
    
    if (!await this.isNavigationButtonEnabled('back')) {
      throw new Error(ERROR_MESSAGES.NAVIGATION_DISABLED_BUTTON.replace('{button}', 'back'));
    }
    
    // Get current index for validation
    const currentIndex = await this.getCurrentMoveIndex();
    if (currentIndex === 0) {
      throw new Error(ERROR_MESSAGES.NAVIGATION_ALREADY_AT_BOUNDARY
        .replace('{direction}', 'back')
        .replace('{position}', 'start'));
    }
    
    await button.click();
    
    await this.waitForEngineSync();
    await this.waitForMoveIndex(currentIndex - 1);
    
    this.log('info', 'Successfully navigated back one move');
  }

  /**
   * Navigate forward one move
   * Includes boundary condition checking and state validation
   */
  async goForward(): Promise<void> {
    this.log('info', 'Navigating forward one move');
    
    await this.handleRapidNavigationDebouncing();
    
    const button = await this.getNavigationButton('forward');
    
    if (!await this.isNavigationButtonEnabled('forward')) {
      throw new Error(ERROR_MESSAGES.NAVIGATION_DISABLED_BUTTON.replace('{button}', 'forward'));
    }
    
    // Get current index and total moves for validation
    const currentIndex = await this.getCurrentMoveIndex();
    const totalMoves = await this.getTotalMoves();
    
    if (currentIndex >= totalMoves - 1) {
      throw new Error(ERROR_MESSAGES.NAVIGATION_ALREADY_AT_BOUNDARY
        .replace('{direction}', 'forward')
        .replace('{position}', 'end'));
    }
    
    await button.click();
    
    await this.waitForEngineSync();
    await this.waitForMoveIndex(currentIndex + 1);
    
    this.log('info', 'Successfully navigated forward one move');
  }

  /**
   * Navigate to end position (last move)
   * Implements comprehensive error handling and state synchronization
   */
  async goToEnd(): Promise<void> {
    this.log('info', 'Navigating to end position');
    
    await this.handleRapidNavigationDebouncing();
    
    const button = await this.getNavigationButton('end');
    
    if (!await this.isNavigationButtonEnabled('end')) {
      throw new Error(ERROR_MESSAGES.NAVIGATION_DISABLED_BUTTON.replace('{button}', 'end'));
    }
    
    const totalMoves = await this.getTotalMoves();
    
    await button.click();
    
    await this.waitForEngineSync();
    await this.waitForMoveIndex(totalMoves - 1);
    
    this.log('info', 'Successfully navigated to end position');
  }

  /**
   * Check if back navigation is enabled
   * Comprehensive state validation method
   */
  async isBackEnabled(): Promise<boolean> {
    try {
      return await this.isNavigationButtonEnabled('back');
    } catch (error) {
      this.log('error', 'Failed to check back navigation state', { 
        error: (error as Error).message 
      });
      return false;
    }
  }

  /**
   * Check if forward navigation is enabled
   * Comprehensive state validation method (added per consensus recommendation)
   */
  async isForwardEnabled(): Promise<boolean> {
    try {
      return await this.isNavigationButtonEnabled('forward');
    } catch (error) {
      this.log('error', 'Failed to check forward navigation state', { 
        error: (error as Error).message 
      });
      return false;
    }
  }

  /**
   * Get current move index from DOM (DOM-as-SSOT approach)
   * Essential for state validation and boundary checking
   * Follows MoveListComponent.getMoveCount() pattern for consistency
   */
  async getCurrentMoveIndex(): Promise<number> {
    try {
      // DOM-first approach: Read from rendered UI like a real user
      const index = await this.page.evaluate(() => {
        // Try multiple DOM sources for robustness
        
        // Method 1: Check for explicit move index data attribute
        const movePanel = document.querySelector('[data-testid="move-panel"]');
        if (movePanel) {
          const indexAttr = movePanel.getAttribute('data-current-move-index');
          if (indexAttr !== null) {
            return parseInt(indexAttr, 10);
          }
        }
        
        // Method 2: Parse from navigation display text (e.g., "Move 1 / 3")
        const navContainer = document.querySelector('[data-testid="move-navigation"], [data-testid="navigation-controls"]');
        if (navContainer) {
          const moveCounter = navContainer.querySelector('[data-testid="move-counter"], .move-counter');
          if (moveCounter) {
            const text = moveCounter.textContent?.trim() || '';
            const match = text.match(/(\d+)\s*\/\s*\d+/); // "1 / 3" format
            if (match) {
              return parseInt(match[1], 10) - 1; // Convert to 0-based index
            }
          }
        }
        
        // Method 3: Count active move indicators in move list
        const activeMoves = document.querySelectorAll('[data-testid="move-item"][data-active="true"], .move-item.active, .move-active');
        if (activeMoves.length === 1) {
          const activeElement = activeMoves[0];
          const moveNumber = activeElement.getAttribute('data-move-number');
          if (moveNumber) {
            return parseInt(moveNumber, 10) - 1; // Convert to 0-based index
          }
        }
        
        // Method 4: Fallback - count enabled back button clicks needed to reach start
        const backButton = document.querySelector('[data-testid="nav-back"], [data-action="go-back"]');
        if (backButton && backButton.hasAttribute('disabled')) {
          return 0; // At start position
        }
        
        // Default fallback
        return 0;
      });
      
      this.log('info', `Current move index: ${index}`);
      return index;
    } catch (error) {
      this.log('error', 'Failed to get current move index from DOM', { 
        error: (error as Error).message 
      });
      return 0;
    }
  }

  /**
   * Get total number of moves from DOM (DOM-as-SSOT approach)
   * Essential for boundary validation and navigation logic
   * Consistent with MoveListComponent.getMoveCount() pattern
   */
  async getTotalMoves(): Promise<number> {
    try {
      // DOM-first approach: Read total moves from rendered UI
      const totalMoves = await this.page.evaluate(() => {
        // Method 1: Check move panel data attribute (immediate store state)
        const movePanel = document.querySelector('[data-testid="move-panel"]');
        if (movePanel) {
          const dataCount = movePanel.getAttribute('data-move-count');
          if (dataCount !== null) {
            return parseInt(dataCount, 10);
          }
        }
        
        // Method 2: Parse from navigation display text (e.g., "Move 1 / 3")
        const navContainer = document.querySelector('[data-testid="move-navigation"], [data-testid="navigation-controls"]');
        if (navContainer) {
          const moveCounter = navContainer.querySelector('[data-testid="move-counter"], .move-counter');
          if (moveCounter) {
            const text = moveCounter.textContent?.trim() || '';
            const match = text.match(/\d+\s*\/\s*(\d+)/); // "1 / 3" format
            if (match) {
              return parseInt(match[1], 10);
            }
          }
        }
        
        // Method 3: Count actual move elements in move list
        const moveElements = document.querySelectorAll('[data-testid="move-item"], .move-item, [class*="move-"]');
        if (moveElements.length > 0) {
          return moveElements.length;
        }
        
        // Method 4: Check if end button is disabled (indicates we're at end)
        const endButton = document.querySelector('[data-testid="nav-end"], [data-action="go-end"]');
        if (endButton && endButton.hasAttribute('disabled')) {
          // If end is disabled and we can find current index, total = current + 1
          const backButton = document.querySelector('[data-testid="nav-back"], [data-action="go-back"]');
          if (backButton && !backButton.hasAttribute('disabled')) {
            // We're at end, but not at start, so there are multiple moves
            return 1; // At least 1 move exists
          }
        }
        
        // Default fallback
        return 0;
      });
      
      this.log('info', `Total moves: ${totalMoves}`);
      return totalMoves;
    } catch (error) {
      this.log('error', 'Failed to get total moves from DOM', { 
        error: (error as Error).message 
      });
      return 0;
    }
  }

  /**
   * Check if currently at start position
   * Utility method for boundary condition checking
   */
  async isAtStart(): Promise<boolean> {
    try {
      const currentIndex = await this.getCurrentMoveIndex();
      return currentIndex === NAVIGATION_CONFIG.BOUNDARY_POSITIONS.START;
    } catch (error) {
      this.log('error', 'Failed to check if at start position', { 
        error: (error as Error).message 
      });
      return false;
    }
  }

  /**
   * Check if currently at end position
   * Utility method for boundary condition checking
   */
  async isAtEnd(): Promise<boolean> {
    try {
      const currentIndex = await this.getCurrentMoveIndex();
      const totalMoves = await this.getTotalMoves();
      return currentIndex === totalMoves - 1;
    } catch (error) {
      this.log('error', 'Failed to check if at end position', { 
        error: (error as Error).message 
      });
      return false;
    }
  }

  /**
   * Handle empty game validation
   * Prevents navigation operations on games with no moves
   */
  private async validateGameNotEmpty(): Promise<void> {
    const totalMoves = await this.getTotalMoves();
    if (totalMoves === 0) {
      this.log('error', 'Navigation attempted on empty game');
      throw new Error(ERROR_MESSAGES.NAVIGATION_EMPTY_GAME);
    }
  }

  /**
   * Comprehensive navigation state information
   * Useful for debugging and test validation
   */
  async getNavigationState(): Promise<{
    currentMoveIndex: number;
    totalMoves: number;
    isAtStart: boolean;
    isAtEnd: boolean;
    isBackEnabled: boolean;
    isForwardEnabled: boolean;
  }> {
    const [currentMoveIndex, totalMoves, isAtStart, isAtEnd, isBackEnabled, isForwardEnabled] = await Promise.all([
      this.getCurrentMoveIndex(),
      this.getTotalMoves(),
      this.isAtStart(),
      this.isAtEnd(),
      this.isBackEnabled(),
      this.isForwardEnabled()
    ]);

    return {
      currentMoveIndex,
      totalMoves,
      isAtStart,
      isAtEnd,
      isBackEnabled,
      isForwardEnabled
    };
  }
}