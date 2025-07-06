/**
 * DEBUG TABLEBASE FLOW TEST
 * 
 * Testet den kompletten Flow von Tablebase API bis zur UI
 */

import { tablebaseService } from '@/lib/chess/tablebase';
import { getMoveQualityByTablebaseComparison } from '@/utils/chess/evaluationHelpers';
import type { FormattedEvaluation } from '@/types/evaluation';

describe('Debug Tablebase Flow', () => {
  const SCREENSHOT_FEN = '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1';
  
  beforeEach(() => {
    // Mock fetch to return correct tablebase data
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        category: 'win',
        dtz: 9,
        precise_dtz: 9,
        moves: [
          {
            uci: 'c8d7',
            san: 'Kd7',
            category: 'loss', // Loss for opponent = good for us
            dtz: -10,
            precise_dtz: -10
          }
        ]
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sollte den kompletten Flow testen', async () => {
    console.log('=== TESTING COMPLETE FLOW ===');
    
    // Step 1: Test tablebaseService
    const result = await tablebaseService.queryPosition(SCREENSHOT_FEN);
    console.log('1. Tablebase Service Result:', JSON.stringify(result, null, 2));
    
    expect(result.isTablebasePosition).toBe(true);
    expect(result.result?.wdl).toBe(2); // Win
    expect(result.result?.category).toBe('win');
    
    // Step 2: Test move quality calculation
    const moveQuality = getMoveQualityByTablebaseComparison(
      2,  // Win before
      2,  // Win after (Kd7 maintains win)
      'w' // White to move
    );
    
    console.log('2. Move Quality:', moveQuality);
    expect(moveQuality.text).toBe('✅');
    expect(moveQuality.className).toBe('eval-excellent');
    
    console.log('✅ Flow works correctly with proper mock');
  });

  it('sollte das echte Problem simulieren - leere API Response', async () => {
    console.log('=== SIMULATING REAL PROBLEM ===');
    
    // Mock empty response (JSDOM issue)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}) // Empty object!
    });
    
    try {
      const result = await tablebaseService.queryPosition(SCREENSHOT_FEN);
      console.log('Result with empty response:', result);
      
      // With the fix in tablebase.ts, this should now throw an error
      // instead of returning default values
      fail('Should have thrown an error for empty response');
    } catch (error: any) {
      console.log('✅ Correctly threw error:', error.message);
      expect(error.message).toContain('Invalid tablebase response');
    }
  });

  it('sollte testen was UnifiedEvaluationService macht', async () => {
    // Import the unified service
    const { UnifiedEvaluationService } = await import('@/lib/chess/evaluation/unifiedService');
    const { EngineProviderAdapter, TablebaseProviderAdapter } = await import('@/lib/chess/evaluation/providerAdapters');
    const { LRUCache } = await import('@/lib/cache/LRUCache');
    const { LRUCacheAdapter } = await import('@/lib/chess/evaluation/cacheAdapter');
    
    // Setup service
    const lruCache = new LRUCache<FormattedEvaluation>(200);
    const cache = new LRUCacheAdapter(lruCache);
    const engineProvider = new EngineProviderAdapter();
    const tablebaseProvider = new TablebaseProviderAdapter();
    
    const unifiedService = new UnifiedEvaluationService(
      engineProvider,
      tablebaseProvider,
      cache
    );
    
    // Mock EngineService to avoid real engine initialization
    jest.mock('@/services/chess/EngineService', () => ({
      EngineService: {
        getInstance: () => ({
          getEngine: jest.fn().mockResolvedValue({
            getTablebaseInfo: jest.fn().mockResolvedValue({
              isTablebasePosition: true,
              result: {
                wdl: 2,
                dtz: 9,
                category: 'win',
                precise: true
              }
            })
          })
        })
      }
    }));
    
    console.log('=== TESTING UNIFIED SERVICE ===');
    
    const formatted = await unifiedService.getFormattedEvaluation(SCREENSHOT_FEN, 'w');
    console.log('Formatted evaluation:', formatted);
    
    const perspective = await unifiedService.getPerspectiveEvaluation(SCREENSHOT_FEN, 'w');
    console.log('Perspective evaluation:', perspective);
  });
});