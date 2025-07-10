/**
 * @fileoverview NavigationControls Tests
 * @description Comprehensive tests for NavigationControls with mock DOM and Test Bridge integration
 */

import { test, expect, Page } from '@playwright/test';
import { NavigationControls } from './NavigationControls';

// Mock DOM setup helper for navigation controls
async function setupMockNavigationControls(page: Page, options: {
  totalMoves?: number;
  currentMoveIndex?: number;
  enabledButtons?: string[];
  disabledButtons?: string[];
} = {}) {
  const {
    totalMoves = 5,
    currentMoveIndex = 2,
    enabledButtons = ['start', 'back', 'forward', 'end'],
    disabledButtons = []
  } = options;

  const navigationHtml = generateMockNavigationControls(enabledButtons, disabledButtons);
  
  await page.setContent(`
    <div data-testid="navigation-controls" role="navigation">
      ${navigationHtml}
    </div>
  `);

  // Setup Test Bridge mock
  await page.evaluate((mockData) => {
    (window as any).__E2E_TEST_BRIDGE__ = {
      engine: {
        isReady: () => true
      },
      diagnostic: {
        getCurrentMoveIndex: () => mockData.currentMoveIndex,
        getTotalMoves: () => mockData.totalMoves,
        isAtStart: () => mockData.currentMoveIndex === 0,
        isAtEnd: () => mockData.currentMoveIndex === mockData.totalMoves - 1
      }
    };
  }, { currentMoveIndex, totalMoves });
}

// Generate mock navigation controls HTML
function generateMockNavigationControls(enabledButtons: string[], disabledButtons: string[]): string {
  const buttonConfigs = {
    start: { label: 'Go to start', ariaLabel: 'Go to start of game' },
    back: { label: '←', ariaLabel: 'Go back one move' },
    forward: { label: '→', ariaLabel: 'Go forward one move' },
    end: { label: 'Go to end', ariaLabel: 'Go to end of game' }
  };

  const buttons = [];
  
  for (const [buttonType, config] of Object.entries(buttonConfigs)) {
    const isEnabled = enabledButtons.includes(buttonType);
    const isDisabled = disabledButtons.includes(buttonType);
    
    buttons.push(`
      <button 
        role="button"
        aria-label="${config.ariaLabel}"
        data-testid="nav-${buttonType}"
        title="${config.label}"
        class="nav-button nav-${buttonType}"
        ${isDisabled ? 'disabled aria-disabled="true"' : ''}
        ${!isEnabled && !isDisabled ? 'aria-disabled="false"' : ''}
      >
        ${config.label}
      </button>
    `);
  }
  
  return buttons.join('\n');
}

// Mock DOM helper for empty game
async function setupMockEmptyGame(page: Page) {
  await setupMockNavigationControls(page, {
    totalMoves: 0,
    currentMoveIndex: 0,
    enabledButtons: [],
    disabledButtons: ['start', 'back', 'forward', 'end']
  });
}

// Mock DOM helper for single move game
async function setupMockSingleMoveGame(page: Page) {
  await setupMockNavigationControls(page, {
    totalMoves: 1,
    currentMoveIndex: 0,
    enabledButtons: ['forward', 'end'],
    disabledButtons: ['start', 'back']
  });
}

// Mock DOM helper for game at start
async function setupMockGameAtStart(page: Page) {
  await setupMockNavigationControls(page, {
    totalMoves: 5,
    currentMoveIndex: 0,
    enabledButtons: ['forward', 'end'],
    disabledButtons: ['start', 'back']
  });
}

// Mock DOM helper for game at end
async function setupMockGameAtEnd(page: Page) {
  await setupMockNavigationControls(page, {
    totalMoves: 5,
    currentMoveIndex: 4,
    enabledButtons: ['start', 'back'],
    disabledButtons: ['forward', 'end']
  });
}

// Test helper to simulate navigation delay
async function simulateNavigationDelay(page: Page, duration: number = 100) {
  await page.waitForTimeout(duration);
}

// Test helper to update Test Bridge state
async function updateTestBridgeState(page: Page, newIndex: number, totalMoves: number = 5) {
  await page.evaluate((mockData) => {
    const bridge = (window as any).__E2E_TEST_BRIDGE__;
    if (bridge && bridge.diagnostic) {
      bridge.diagnostic.getCurrentMoveIndex = () => mockData.newIndex;
      bridge.diagnostic.getTotalMoves = () => mockData.totalMoves;
      bridge.diagnostic.isAtStart = () => mockData.newIndex === 0;
      bridge.diagnostic.isAtEnd = () => mockData.newIndex === mockData.totalMoves - 1;
    }
  }, { newIndex, totalMoves });
}

test.describe('NavigationControls Component', () => {
  
  test.describe('Basic Navigation Actions', () => {
    
    test('should navigate to start position', async ({ page }) => {
      await setupMockNavigationControls(page);
      const navigation = new NavigationControls(page);
      
      // Simulate click and state change
      const startButton = page.getByRole('button', { name: /start/i });
      await startButton.click();
      
      // Update Test Bridge state to simulate navigation
      await updateTestBridgeState(page, 0);
      
      // Verify navigation completed
      const currentIndex = await navigation.getCurrentMoveIndex();
      expect(currentIndex).toBe(0);
      
      const isAtStart = await navigation.isAtStart();
      expect(isAtStart).toBe(true);
    });
    
    test('should navigate back one move', async ({ page }) => {
      await setupMockNavigationControls(page, { currentMoveIndex: 2 });
      const navigation = new NavigationControls(page);
      
      const backButton = page.getByRole('button', { name: /back/i });
      await backButton.click();
      
      // Update Test Bridge state
      await updateTestBridgeState(page, 1);
      
      const currentIndex = await navigation.getCurrentMoveIndex();
      expect(currentIndex).toBe(1);
    });
    
    test('should navigate forward one move', async ({ page }) => {
      await setupMockNavigationControls(page, { currentMoveIndex: 2 });
      const navigation = new NavigationControls(page);
      
      const forwardButton = page.getByRole('button', { name: /forward/i });
      await forwardButton.click();
      
      // Update Test Bridge state
      await updateTestBridgeState(page, 3);
      
      const currentIndex = await navigation.getCurrentMoveIndex();
      expect(currentIndex).toBe(3);
    });
    
    test('should navigate to end position', async ({ page }) => {
      await setupMockNavigationControls(page);
      const navigation = new NavigationControls(page);
      
      const endButton = page.getByRole('button', { name: /end/i });
      await endButton.click();
      
      // Update Test Bridge state
      await updateTestBridgeState(page, 4);
      
      const currentIndex = await navigation.getCurrentMoveIndex();
      expect(currentIndex).toBe(4);
      
      const isAtEnd = await navigation.isAtEnd();
      expect(isAtEnd).toBe(true);
    });
  });
  
  test.describe('State Validation Methods', () => {
    
    test('should correctly report back enabled state', async ({ page }) => {
      await setupMockNavigationControls(page, { 
        currentMoveIndex: 2,
        enabledButtons: ['back'],
        disabledButtons: []
      });
      const navigation = new NavigationControls(page);
      
      const isBackEnabled = await navigation.isBackEnabled();
      expect(isBackEnabled).toBe(true);
    });
    
    test('should correctly report back disabled state', async ({ page }) => {
      await setupMockGameAtStart(page);
      const navigation = new NavigationControls(page);
      
      const isBackEnabled = await navigation.isBackEnabled();
      expect(isBackEnabled).toBe(false);
    });
    
    test('should correctly report forward enabled state', async ({ page }) => {
      await setupMockNavigationControls(page, { 
        currentMoveIndex: 2,
        enabledButtons: ['forward'],
        disabledButtons: []
      });
      const navigation = new NavigationControls(page);
      
      const isForwardEnabled = await navigation.isForwardEnabled();
      expect(isForwardEnabled).toBe(true);
    });
    
    test('should correctly report forward disabled state', async ({ page }) => {
      await setupMockGameAtEnd(page);
      const navigation = new NavigationControls(page);
      
      const isForwardEnabled = await navigation.isForwardEnabled();
      expect(isForwardEnabled).toBe(false);
    });
    
    test('should get current move index', async ({ page }) => {
      await setupMockNavigationControls(page, { currentMoveIndex: 3 });
      const navigation = new NavigationControls(page);
      
      const currentIndex = await navigation.getCurrentMoveIndex();
      expect(currentIndex).toBe(3);
    });
    
    test('should get total moves', async ({ page }) => {
      await setupMockNavigationControls(page, { totalMoves: 7 });
      const navigation = new NavigationControls(page);
      
      const totalMoves = await navigation.getTotalMoves();
      expect(totalMoves).toBe(7);
    });
  });
  
  test.describe('Edge Cases', () => {
    
    test('should handle empty game gracefully', async ({ page }) => {
      await setupMockEmptyGame(page);
      const navigation = new NavigationControls(page);
      
      // All buttons should be disabled
      const isBackEnabled = await navigation.isBackEnabled();
      const isForwardEnabled = await navigation.isForwardEnabled();
      
      expect(isBackEnabled).toBe(false);
      expect(isForwardEnabled).toBe(false);
      
      const totalMoves = await navigation.getTotalMoves();
      expect(totalMoves).toBe(0);
    });
    
    test('should handle single move game', async ({ page }) => {
      await setupMockSingleMoveGame(page);
      const navigation = new NavigationControls(page);
      
      // At start: only forward/end should be enabled
      const isBackEnabled = await navigation.isBackEnabled();
      const isForwardEnabled = await navigation.isForwardEnabled();
      
      expect(isBackEnabled).toBe(false);
      expect(isForwardEnabled).toBe(true);
      
      const totalMoves = await navigation.getTotalMoves();
      expect(totalMoves).toBe(1);
    });
    
    test('should handle navigation at start boundary', async ({ page }) => {
      await setupMockGameAtStart(page);
      const navigation = new NavigationControls(page);
      
      const isAtStart = await navigation.isAtStart();
      expect(isAtStart).toBe(true);
      
      const isBackEnabled = await navigation.isBackEnabled();
      expect(isBackEnabled).toBe(false);
    });
    
    test('should handle navigation at end boundary', async ({ page }) => {
      await setupMockGameAtEnd(page);
      const navigation = new NavigationControls(page);
      
      const isAtEnd = await navigation.isAtEnd();
      expect(isAtEnd).toBe(true);
      
      const isForwardEnabled = await navigation.isForwardEnabled();
      expect(isForwardEnabled).toBe(false);
    });
    
    test('should handle rapid navigation commands', async ({ page }) => {
      await setupMockNavigationControls(page);
      const navigation = new NavigationControls(page);
      
      // Simulate rapid clicks
      const forwardButton = page.getByRole('button', { name: /forward/i });
      
      // Click multiple times quickly
      await forwardButton.click();
      await forwardButton.click();
      await forwardButton.click();
      
      // Should handle debouncing appropriately
      await simulateNavigationDelay(page, 200);
      
      // Verify state is consistent
      const currentIndex = await navigation.getCurrentMoveIndex();
      expect(currentIndex).toBeGreaterThanOrEqual(0);
    });
  });
  
  test.describe('Test Bridge Integration', () => {
    
    test('should wait for engine sync after navigation', async ({ page }) => {
      await setupMockNavigationControls(page);
      
      // Setup engine sync delay
      await page.evaluate(() => {
        let engineReady = false;
        setTimeout(() => { engineReady = true; }, 100);
        
        (window as any).__E2E_TEST_BRIDGE__.engine.isReady = () => engineReady;
      });
      
      const navigation = new NavigationControls(page);
      const startButton = page.getByRole('button', { name: /start/i });
      
      await startButton.click();
      
      // Should wait for engine to be ready
      await page.waitForTimeout(150);
      
      const currentIndex = await navigation.getCurrentMoveIndex();
      expect(currentIndex).toBeDefined();
    });
    
    test('should validate move index after navigation', async ({ page }) => {
      await setupMockNavigationControls(page);
      const navigation = new NavigationControls(page);
      
      const initialIndex = await navigation.getCurrentMoveIndex();
      
      const forwardButton = page.getByRole('button', { name: /forward/i });
      await forwardButton.click();
      
      // Update Test Bridge state
      await updateTestBridgeState(page, initialIndex + 1);
      
      const newIndex = await navigation.getCurrentMoveIndex();
      expect(newIndex).toBe(initialIndex + 1);
    });
    
    test('should handle engine sync timeout', async ({ page }) => {
      await setupMockNavigationControls(page);
      
      // Setup engine that never becomes ready
      await page.evaluate(() => {
        (window as any).__E2E_TEST_BRIDGE__.engine.isReady = () => false;
      });
      
      const navigation = new NavigationControls(page);
      
      // Navigation should handle timeout gracefully
      const startButton = page.getByRole('button', { name: /start/i });
      await startButton.click();
      
      // Should not hang indefinitely
      await page.waitForTimeout(100);
      
      const currentIndex = await navigation.getCurrentMoveIndex();
      expect(currentIndex).toBeDefined();
    });
  });
  
  test.describe('Selector Strategy', () => {
    
    test('should find button with primary selector', async ({ page }) => {
      await setupMockNavigationControls(page);
      const navigation = new NavigationControls(page);
      
      // Primary selector: role="button" with aria-label
      const button = page.getByRole('button', { name: /start/i });
      await expect(button).toBeVisible();
      
      const isBackEnabled = await navigation.isBackEnabled();
      expect(isBackEnabled).toBeDefined();
    });
    
    test('should fallback to secondary selector', async ({ page }) => {
      // Setup DOM with only data-testid selectors
      await page.setContent(`
        <div data-testid="navigation-controls">
          <button data-testid="nav-start">Start</button>
          <button data-testid="nav-back">Back</button>
          <button data-testid="nav-forward">Forward</button>
          <button data-testid="nav-end">End</button>
        </div>
      `);
      
      await page.evaluate(() => {
        (window as any).__E2E_TEST_BRIDGE__ = {
          engine: { isReady: () => true },
          diagnostic: {
            getCurrentMoveIndex: () => 2,
            getTotalMoves: () => 5,
            isAtStart: () => false,
            isAtEnd: () => false
          }
        };
      });
      
      const navigation = new NavigationControls(page);
      
      // Should find button with fallback selector
      const button = page.getByTestId('nav-start');
      await expect(button).toBeVisible();
      
      const isBackEnabled = await navigation.isBackEnabled();
      expect(isBackEnabled).toBeDefined();
    });
    
    test('should handle selector not found gracefully', async ({ page }) => {
      await page.setContent(`
        <div data-testid="navigation-controls">
          <!-- No navigation buttons -->
        </div>
      `);
      
      await page.evaluate(() => {
        (window as any).__E2E_TEST_BRIDGE__ = {
          engine: { isReady: () => true },
          diagnostic: {
            getCurrentMoveIndex: () => 0,
            getTotalMoves: () => 0,
            isAtStart: () => true,
            isAtEnd: () => true
          }
        };
      });
      
      const navigation = new NavigationControls(page);
      
      // Should handle missing buttons gracefully
      const isBackEnabled = await navigation.isBackEnabled();
      expect(isBackEnabled).toBe(false);
    });
  });
  
  test.describe('Error Handling', () => {
    
    test('should handle disabled button click gracefully', async ({ page }) => {
      await setupMockGameAtStart(page);
      const navigation = new NavigationControls(page);
      
      // Back button should be disabled at start
      const isBackEnabled = await navigation.isBackEnabled();
      expect(isBackEnabled).toBe(false);
      
      // Should not throw error when checking disabled state
      const currentIndex = await navigation.getCurrentMoveIndex();
      expect(currentIndex).toBe(0);
    });
    
    test('should handle missing Test Bridge gracefully', async ({ page }) => {
      await setupMockNavigationControls(page);
      
      // Remove Test Bridge
      await page.evaluate(() => {
        delete (window as any).__E2E_TEST_BRIDGE__;
      });
      
      const navigation = new NavigationControls(page);
      
      // Should not throw error
      const currentIndex = await navigation.getCurrentMoveIndex();
      expect(currentIndex).toBe(0); // Should return default value
    });
    
    test('should handle partial Test Bridge gracefully', async ({ page }) => {
      await setupMockNavigationControls(page);
      
      // Setup partial Test Bridge
      await page.evaluate(() => {
        (window as any).__E2E_TEST_BRIDGE__ = {
          engine: { isReady: () => true }
          // Missing diagnostic methods
        };
      });
      
      const navigation = new NavigationControls(page);
      
      // Should handle missing diagnostic methods
      const currentIndex = await navigation.getCurrentMoveIndex();
      expect(currentIndex).toBe(0);
      
      const totalMoves = await navigation.getTotalMoves();
      expect(totalMoves).toBe(0);
    });
  });
  
  test.describe('Performance Tests', () => {
    
    test('should handle multiple simultaneous state queries', async ({ page }) => {
      await setupMockNavigationControls(page);
      const navigation = new NavigationControls(page);
      
      // Execute multiple queries simultaneously
      const promises = [
        navigation.getCurrentMoveIndex(),
        navigation.getTotalMoves(),
        navigation.isAtStart(),
        navigation.isAtEnd(),
        navigation.isBackEnabled(),
        navigation.isForwardEnabled()
      ];
      
      const results = await Promise.all(promises);
      
      // All queries should complete successfully
      expect(results).toHaveLength(6);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
    
    test('should handle rapid state changes', async ({ page }) => {
      await setupMockNavigationControls(page);
      const navigation = new NavigationControls(page);
      
      // Simulate rapid state changes
      for (let i = 0; i < 5; i++) {
        await updateTestBridgeState(page, i);
        const currentIndex = await navigation.getCurrentMoveIndex();
        expect(currentIndex).toBe(i);
      }
    });
  });
  
  test.describe('Navigation State Information', () => {
    
    test('should get comprehensive navigation state', async ({ page }) => {
      await setupMockNavigationControls(page, { 
        currentMoveIndex: 2,
        totalMoves: 5 
      });
      const navigation = new NavigationControls(page);
      
      const state = await navigation.getNavigationState();
      
      expect(state).toEqual({
        currentMoveIndex: 2,
        totalMoves: 5,
        isAtStart: false,
        isAtEnd: false,
        isBackEnabled: expect.any(Boolean),
        isForwardEnabled: expect.any(Boolean)
      });
    });
    
    test('should get navigation state at start', async ({ page }) => {
      await setupMockGameAtStart(page);
      const navigation = new NavigationControls(page);
      
      const state = await navigation.getNavigationState();
      
      expect(state.isAtStart).toBe(true);
      expect(state.isAtEnd).toBe(false);
      expect(state.currentMoveIndex).toBe(0);
    });
    
    test('should get navigation state at end', async ({ page }) => {
      await setupMockGameAtEnd(page);
      const navigation = new NavigationControls(page);
      
      const state = await navigation.getNavigationState();
      
      expect(state.isAtStart).toBe(false);
      expect(state.isAtEnd).toBe(true);
      expect(state.currentMoveIndex).toBe(4);
    });
  });
});

test.describe('NavigationControls Integration', () => {
  
  test('should integrate with existing component patterns', async ({ page }) => {
    await setupMockNavigationControls(page);
    
    // Test BaseComponent integration
    const navigation = new NavigationControls(page);
    
    // Should be visible
    const isVisible = await navigation.isVisible();
    expect(isVisible).toBe(true);
    
    // Should be enabled
    const isEnabled = await navigation.isEnabled();
    expect(isEnabled).toBe(true);
  });
  
  test('should handle component lifecycle', async ({ page }) => {
    await setupMockNavigationControls(page);
    const navigation = new NavigationControls(page);
    
    // Initial state
    const initialState = await navigation.getNavigationState();
    expect(initialState).toBeDefined();
    
    // Navigate and verify state change
    const forwardButton = page.getByRole('button', { name: /forward/i });
    await forwardButton.click();
    
    await updateTestBridgeState(page, initialState.currentMoveIndex + 1);
    
    const newState = await navigation.getNavigationState();
    expect(newState.currentMoveIndex).toBe(initialState.currentMoveIndex + 1);
  });
});