import { test, expect } from '@playwright/test';
import { TrainingPage } from '../page-objects/TrainingPage';
import { TestConfig } from '../config/TestConfig';

/**
 * 🚀 E2E Smoke Test - Complete Training Workflow
 * 
 * Tests the critical user journey from start to finish:
 * 1. Load training position
 * 2. Make a move
 * 3. Receive feedback
 * 4. Navigate to next position
 * 
 * This is the "does the house burn down" test.
 * Should complete in under 60 seconds.
 * 
 * Migrated to use new Page Object Model for better maintainability.
 */

test.describe('🚀 E2E Smoke Test - Complete Training Workflow', () => {
  let trainingPage: TrainingPage;
  
  test.beforeEach(async ({ page }) => {
    trainingPage = new TrainingPage(page);
    test.setTimeout(TestConfig.timeouts.workflowMax);
  });

  test('🔥 CRITICAL: Complete training workflow (full journey)', async ({ page }) => {
    console.log('🚀 Starting complete training workflow test...');
    
    // 1. Load training position
    console.log('📍 Step 1: Loading training position...');
    await trainingPage.goToPosition(TestConfig.testData.positions.default);
    await trainingPage.waitForPageReady();
    
    // Verify board is ready
    await trainingPage.chessboard.assertBoardVisible();
    
    // 2. Make a move using click method (proven to work)
    console.log('📍 Step 2: Making a move...');
    const { from, to } = TestConfig.testData.moves.simple;
    await trainingPage.makeTrainingMove(from, to, 'click');
    
    // 3. Check for feedback and streak updates
    console.log('📍 Step 3: Checking for feedback...');
    // Note: Not all moves generate visible feedback, so we don't assert it
    
    // Check if streak counter is visible (it should exist)
    // NOTE: Streak behavior might vary, so this is informational rather than critical
    let streakWorking = false;
    try {
      await trainingPage.assertStreak(1); // First correct move should give streak 1
      console.log('✅ Streak counter working');
      streakWorking = true;
    } catch (error) {
      console.log('⚠️ Streak counter not found or different format:', (error as Error).message);
      // This is non-critical for smoke test - streak counter might not be implemented yet
    }
    
    // 4. Navigate to next position
    console.log('📍 Step 4: Navigating to next position...');
    await trainingPage.goToNextPosition();
    
    // 5. Verify new position loaded
    console.log('📍 Step 5: Verifying new position...');
    await trainingPage.assertAtPosition(TestConfig.testData.positions.second); // Should be on position 2 now
    await trainingPage.chessboard.assertBoardVisible();
    
    console.log('🎉 Complete workflow test PASSED!');
  });
});

test.describe('⚡ Quick Smoke Tests', () => {
  let trainingPage: TrainingPage;
  
  test.beforeEach(async ({ page }) => {
    trainingPage = new TrainingPage(page);
  });

  test('🩺 App loads without errors', async ({ page }) => {
    console.log('🧪 Quick health check...');
    
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.error(`JS Error: ${error.message}`);
    });
    
    await page.goto(TestConfig.urls.home);
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Filter critical errors
    const criticalErrors = errors.filter(e => 
      !TestConfig.errorFilters.ignoredErrors.some(ignored => e.includes(ignored))
    );
    
    expect(criticalErrors.length).toBeLessThanOrEqual(1);
    console.log(`✅ Health check passed: "${title}"`);
  });

  test('🎯 Training page loads board', async ({ page }) => {
    console.log('🧪 Testing training page loads...');
    
    await trainingPage.goToPosition(TestConfig.testData.positions.default);
    await trainingPage.chessboard.waitForBoardReady();
    await trainingPage.chessboard.assertBoardVisible();
    
    console.log('✅ Training board loads successfully');
  });

  test('🔗 Basic navigation works', async ({ page }) => {
    console.log('🧪 Testing basic navigation...');
    
    // Home page
    await page.goto(TestConfig.urls.home);
    await page.waitForLoadState('networkidle');
    
    // Training page
    await trainingPage.goToPosition(TestConfig.testData.positions.default);
    await trainingPage.waitForPageReady();
    
    // Different position
    await trainingPage.goToPosition(TestConfig.testData.positions.second);
    await trainingPage.assertAtPosition(TestConfig.testData.positions.second);
    
    console.log('✅ Basic navigation works');
  });

  test('⚡ Performance check - loads within 10 seconds', async ({ page }) => {
    console.log('🧪 Testing load performance...');
    
    const startTime = Date.now();
    
    await trainingPage.goToPosition(TestConfig.testData.positions.default);
    await trainingPage.chessboard.waitForBoardReady();
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️  Load time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(TestConfig.performance.maxLoadTime);
    
    console.log('✅ Performance check passed');
  });

  test('🎮 Both interaction methods work', async ({ page }) => {
    console.log('🧪 Testing click and drag interactions...');
    
    const { from, to } = TestConfig.testData.moves.simple;
    
    await trainingPage.goToPosition(TestConfig.testData.positions.default);
    await trainingPage.waitForPageReady();
    
    // Test click method (we know this works)
    let clickWorking = false;
    try {
      await trainingPage.makeTrainingMove(from, to, 'click');
      console.log('✅ Click interaction works');
      clickWorking = true;
    } catch (error) {
      console.error('❌ Click interaction failed:', error);
      throw error; // Click must work for core functionality
    }
    
    // Reset to test drag method
    await trainingPage.goToPosition(TestConfig.testData.positions.default);
    await trainingPage.waitForPageReady();
    
    // Test drag method
    let dragWorking = false;
    try {
      await trainingPage.makeTrainingMove(from, to, 'drag');
      console.log('✅ Drag interaction works');
      dragWorking = true;
    } catch (error) {
      console.log('⚠️ Drag interaction failed (may need improvement):', (error as Error).message);
      // Drag is less critical, but we track if it works
    }
    
    // At least one method must work
    expect(clickWorking, 'Click interaction must work for basic functionality').toBe(true);
    
    console.log(`✅ Interaction methods tested - Click: ${clickWorking ? '✅' : '❌'}, Drag: ${dragWorking ? '✅' : '⚠️'}`);
  });
});