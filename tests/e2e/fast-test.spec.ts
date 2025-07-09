/**
 * @fileoverview Fast Test - New Architecture Validation
 * @version 1.0.0
 * @description Quick test to validate the new DI-based engine architecture
 */

import { test, expect } from '@playwright/test';
import { TrainingPage } from './pages/TrainingPage';

test.describe('@smoke Fast Architecture Test', () => {
  let trainingPage: TrainingPage;

  test.beforeEach(async ({ page }) => {
    trainingPage = new TrainingPage(page);
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`Browser ${msg.type()}:`, msg.text());
      }
    });
  });

  test('should work with new mock engine service - instant responses', async () => {
    // Navigate (mock engine automatically injected)
    await trainingPage.goto(1);
    
    // Verify test API is ready
    const initialState = await trainingPage.getGameState();
    expect(initialState.fen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
    expect(initialState.moveCount).toBe(0);
    
    // Make move - should be instant with mock engine
    const moveSuccess = await trainingPage.makeMove('e6-d6');
    expect(moveSuccess).toBe(true);
    
    // Trigger engine analysis - should be instant
    const analysisTriggered = await trainingPage.page.evaluate(async () => {
      const api = (window as any).__testApi;
      return await api.triggerEngineAnalysis(100); // Very short timeout
    });
    
    expect(analysisTriggered).toBe(true);
    
    // Verify move was registered
    const finalState = await trainingPage.getGameState();
    expect(finalState.moveCount).toBe(1);
    expect(finalState.history).toContain('Kd6');
    
    console.log('✅ Fast test completed - new architecture working!');
  });
  
  test('should allow custom mock responses', async () => {
    await trainingPage.goto(1);
    
    // Add custom mock response
    await trainingPage.page.evaluate(() => {
      const api = (window as any).__testApi;
      api.addMockEngineResponse('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', {
        evaluation: 200, // +2.00 pawns
        bestMove: 'Kd7', // Custom move
        depth: 25,
        timeMs: 5
      });
    });
    
    // Trigger analysis with custom response
    const result = await trainingPage.page.evaluate(async () => {
      const api = (window as any).__testApi;
      return await api.triggerEngineAnalysis(50);
    });
    
    expect(result).toBe(true);
    console.log('✅ Custom mock responses working!');
  });
});