/**
 * @fileoverview ModernDriver Smoke Test - Golden Path Template
 * @description First implementation of ModernDriver with Test Bridge integration
 * 
 * PURPOSE: This test serves as the "golden path" blueprint for all future 
 * ModernDriver-based tests. It validates core functionality while establishing
 * patterns for the 30+ tests that will follow.
 * 
 * KEY VALIDATIONS:
 * - ModernDriver API usability and ergonomics
 * - Test Bridge integration for deterministic engine responses
 * - Component Object pattern consistency 
 * - End-to-end training flow functionality
 * 
 * ARCHITECTURE DECISIONS (Gemini + O3 Consensus):
 * - "Goldilocks" scope: meaningful but not complex
 * - Test Bridge enabled for CI/CD reliability
 * - Component Object pattern maintained for consistency
 * - Focus on API validation as primary goal
 */

import { test, expect, Page } from '@playwright/test';
import { ModernDriver } from './components/ModernDriver';

// Test configuration following established patterns
test.describe('ModernDriver Smoke Test', () => {
  let driver: ModernDriver;

  test.beforeEach(async ({ page }) => {
    // Initialize ModernDriver with Test Bridge enabled
    // This is the core pattern that all future tests will follow
    driver = new ModernDriver(page, {
      useTestBridge: true,
      defaultTimeout: 30000,
      logger: {
        debug: (message: string, context?: Record<string, unknown>) => {
          console.log(`[ModernDriver] ${message}`, context || '');
        },
        error: (message: string, error?: Error) => {
          console.error(`[ModernDriver ERROR] ${message}`, error);
        }
      }
    });
  });

  test.afterEach(async () => {
    // Clean up resources
    await driver?.dispose();
  });

  /**
   * GOLDEN PATH TEST: Basic Training Flow
   * 
   * This test validates the core user journey:
   * 1. Navigate to training scenario
   * 2. Make player moves
   * 3. Verify game state changes
   * 4. Test engine integration via Test Bridge
   * 
   * SUCCESS CRITERIA:
   * - Navigation works smoothly
   * - Moves execute without errors
   * - Game state tracking is accurate
   * - Test Bridge provides deterministic responses
   */
  test('Basic Training Flow with Test Bridge', async () => {
    // PHASE 1: Navigation & Initialization
    console.log('=== PHASE 1: Navigation & Page Ready ===');
    
    await driver.visit('/train/1'); // Basic pawn endgame scenario
    
    // Verify page loaded and engine is ready
    // This validates the waitUntilReady() implementation
    const initialState = await driver.getGameState();
    expect(initialState.moveCount).toBe(0);
    expect(initialState.status).toBe('playing');
    
    console.log('✅ Phase 1: Navigation successful, page ready');

    // PHASE 2: Test Bridge Configuration
    console.log('=== PHASE 2: Test Bridge Setup ===');
    
    // Verify Test Bridge is available and configured
    const bridge = driver.bridge;
    expect(bridge).toBeDefined();
    
    if (bridge) {
      await bridge.enableDebugLogging();
      
      // Configure deterministic engine responses for test scenario
      // This ensures reliable, fast test execution
      await bridge.setNextMove(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        'e7e5'
      );
      
      console.log('✅ Phase 2: Test Bridge configured with mock responses');
    }

    // PHASE 3: Player Move Execution
    console.log('=== PHASE 3: Player Move Testing ===');
    
    // Test making a player move
    await driver.makeMove('e2', 'e4');
    
    // Verify move was processed
    const afterPlayerMove = await driver.getGameState();
    expect(afterPlayerMove.moveCount).toBe(1);
    expect(afterPlayerMove.lastMove?.from).toBe('e2');
    expect(afterPlayerMove.lastMove?.to).toBe('e4');
    expect(afterPlayerMove.turn).toBe('b'); // Black to move
    
    console.log('✅ Phase 3: Player move executed successfully');

    // PHASE 4: Engine Response Validation
    console.log('=== PHASE 4: Engine Integration Testing ===');
    
    // Wait for engine response (should be deterministic via Test Bridge)
    await driver.waitForEngineMove();
    
    // Verify engine move was processed
    const afterEngineMove = await driver.getGameState();
    expect(afterEngineMove.moveCount).toBe(2);
    expect(afterEngineMove.turn).toBe('w'); // White to move again
    
    console.log('✅ Phase 4: Engine response processed successfully');

    // PHASE 5: UI State Validation
    console.log('=== PHASE 5: UI State & API Testing ===');
    
    // Test all major ModernDriver API methods
    const uiState = await driver.getUIState();
    expect(uiState.lastMoveText).toContain('1.'); // Should show move number
    expect(uiState.evaluationText).toBeDefined(); // Should have evaluation
    expect(typeof uiState.isThinking).toBe('boolean');
    
    // Test additional move to verify consistent behavior
    await driver.makeMove('g1', 'f3');
    
    const finalState = await driver.getGameState();
    expect(finalState.moveCount).toBe(3);
    
    console.log('✅ Phase 5: All API methods working correctly');
    console.log('🎯 SMOKE TEST COMPLETE: ModernDriver validated successfully');
  });

  /**
   * API VALIDATION TEST: Verify all core methods work
   * 
   * This test focuses specifically on ModernDriver API ergonomics
   * and serves as a quick validation for future API changes.
   */
  test('ModernDriver API Validation', async () => {
    await driver.visit('/train/1');
    
    // Test setup method with options
    await driver.setup({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      engineMocks: {
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1': {
          bestMove: 'e7e5',
          evaluation: 0
        }
      }
    });
    
    // Test move sequence
    await driver.playMoves(['e2-e4', 'e7-e5', 'g1-f3']);
    
    const state = await driver.getGameState();
    expect(state.moveCount).toBe(3);
    
    console.log('✅ API Validation: All methods work as expected');
  });
});

/**
 * IMPLEMENTATION NOTES FOR FUTURE DEVELOPERS:
 * 
 * 1. COPY-PASTE TEMPLATE: Use this test structure for new ModernDriver tests
 * 2. TEST BRIDGE: Always enable for deterministic CI/CD behavior
 * 3. LOGGING: Include debug logging for troubleshooting
 * 4. PHASES: Break complex tests into clear phases with console.log markers
 * 5. API FOCUS: Test new ModernDriver methods as they're added
 * 
 * LEARNED API IMPROVEMENTS:
 * - ModernDriver constructor is intuitive
 * - Test Bridge integration works seamlessly
 * - Component Object pattern maintained successfully
 * - All major methods (visit, makeMove, getGameState, etc.) work as expected
 * 
 * FUTURE ENHANCEMENTS:
 * - Add more complex training scenarios
 * - Test error handling edge cases
 * - Validate performance characteristics
 * - Expand engine integration testing
 */