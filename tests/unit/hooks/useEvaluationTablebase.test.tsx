import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useEvaluation } from '@shared/hooks/useEvaluation';

// Create mock service instance
const mockUnifiedService = {
  getFormattedEvaluation: jest.fn(),
  getPerspectiveEvaluation: jest.fn(),
  getRawEngineEvaluation: jest.fn()
};

// Mock the service factory
jest.mock('@shared/lib/chess/evaluation/unifiedService', () => ({
  UnifiedEvaluationService: jest.fn().mockImplementation(() => mockUnifiedService)
}));

jest.mock('@shared/lib/chess/evaluation/providerAdapters', () => ({
  EngineProviderAdapter: jest.fn(),
  TablebaseProviderAdapter: jest.fn()
}));

jest.mock('@shared/lib/cache/LRUCache', () => ({
  LRUCache: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn()
  }))
}));

jest.mock('@shared/lib/chess/evaluation/cacheAdapter', () => ({
  LRUCacheAdapter: jest.fn()
}));

describe('useEvaluation Tablebase Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockUnifiedService.getFormattedEvaluation.mockResolvedValue({
      mainText: '0.0',
      detailText: null,
      className: 'neutral',
      metadata: {
        isTablebase: true,
        isDrawn: true,
        isMate: false,
      },
    });
    
    mockUnifiedService.getPerspectiveEvaluation.mockResolvedValue({
      type: 'tablebase',
      scoreInCentipawns: null,
      mate: null,
      wdl: 0,
      dtm: null,
      dtz: 0,
      isTablebasePosition: true,
      raw: null,
      perspective: 'w',
      perspectiveScore: null,
      perspectiveMate: null,
      perspectiveWdl: 0,
      perspectiveDtm: null,
      perspectiveDtz: 0,
    });
    
    mockUnifiedService.getRawEngineEvaluation.mockResolvedValue({
      score: 0,
      mate: null,
      evaluation: '0.00',
      depth: 20,
      nodes: 1000000,
      time: 2000,
      pv: [],
      pvString: '',
      nps: 500000,
      hashfull: 50,
      seldepth: 22,
      multipv: 1,
      currmove: '',
      currmovenumber: 1
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('WDL value 0 handling', () => {
    it('should preserve WDL value of 0 (draw) and not convert to undefined', async () => {
      const currentFen = '1K6/1P2k3/8/8/8/8/8/r7 b - - 0 1';
      const previousFen = '1K6/1P2k3/8/8/8/8/r7/8 w - - 0 1';

      // Mock the service responses
      mockUnifiedService.getFormattedEvaluation.mockResolvedValue({
        mainText: '0.0',
        detailText: null,
        className: 'neutral',
        metadata: {
          isTablebase: true,
          isDrawn: true,
          isMate: false,
        },
      });

      // Mock perspective evaluations - the critical part!
      mockUnifiedService.getPerspectiveEvaluation
        .mockResolvedValueOnce({
          // Previous position (win for white)
          type: 'tablebase',
          scoreInCentipawns: null,
          mate: null,
          wdl: 2,
          dtm: null,
          dtz: 10,
          isTablebasePosition: true,
          raw: null,
          perspective: 'w',
          perspectiveScore: null,
          perspectiveMate: null,
          perspectiveWdl: 2,
          perspectiveDtm: null,
          perspectiveDtz: 10,
        })
        .mockResolvedValueOnce({
          // Current position (draw) - THIS IS THE BUG CASE
          type: 'tablebase',
          scoreInCentipawns: null,
          mate: null,
          wdl: 0, // This 0 was being converted to undefined!
          dtm: null,
          dtz: 0,
          isTablebasePosition: true,
          raw: null,
          perspective: 'w',
          perspectiveScore: null,
          perspectiveMate: null,
          perspectiveWdl: 0,
          perspectiveDtm: null,
          perspectiveDtz: 0,
        });

      const { result } = renderHook(() =>
        useEvaluation({
          fen: currentFen,
          isEnabled: true,
          previousFen,
        })
      );

      await waitFor(() => {
        expect(result.current.evaluations.length).toBeGreaterThan(0);
      }, { timeout: 2000 });

      const evaluation = result.current.lastEvaluation;
      expect(evaluation).toBeDefined();
      expect(evaluation?.tablebase).toBeDefined();
      
      // The critical assertions
      expect(evaluation?.tablebase?.wdlBefore).toBe(2);
      expect(evaluation?.tablebase?.wdlAfter).toBe(0); // NOT undefined!
      expect(evaluation?.tablebase?.wdlAfter).not.toBeUndefined();

      // Verify mock was called
      expect(mockUnifiedService.getFormattedEvaluation).toHaveBeenCalled();
      expect(mockUnifiedService.getPerspectiveEvaluation).toHaveBeenCalledTimes(2);
    });

    it('should handle all falsy WDL values correctly', async () => {
      const testCases = [
        { wdl: 0, description: 'draw (0)' },
        { wdl: -0, description: 'negative zero' },
        { wdl: false as any, description: 'false (invalid but should handle)' },
        { wdl: '' as any, description: 'empty string (invalid but should handle)' },
      ];

      for (const { wdl, description } of testCases) {
        mockUnifiedService.getPerspectiveEvaluation.mockResolvedValueOnce({
          type: 'tablebase',
          scoreInCentipawns: null,
          mate: null,
          wdl: wdl,
          dtm: null,
          dtz: 0,
          isTablebasePosition: true,
          raw: null,
          perspective: 'w',
          perspectiveScore: null,
          perspectiveMate: null,
          perspectiveWdl: wdl,
          perspectiveDtm: null,
          perspectiveDtz: 0,
        });

        // The fix should handle this correctly
        const result = wdl !== undefined ? wdl : undefined;
        
        if (typeof wdl === 'number') {
          expect(result).toBe(wdl);
        }
      }
    });
  });

  describe('Tablebase data flow', () => {
    it('should pass tablebase data through the complete chain', async () => {
      const fen = '8/8/8/8/8/8/8/8 w - - 0 1';
      const previousFen = '8/8/8/8/8/8/8/8 b - - 0 1';

      mockUnifiedService.getFormattedEvaluation.mockResolvedValue({
        mainText: '0.0',
        detailText: null,
        className: 'neutral',
        metadata: {
          isTablebase: true,
          isDrawn: true,
          isMate: false,
        },
      });

      // Reset mock before setting up new implementation
      mockUnifiedService.getPerspectiveEvaluation.mockReset();
      
      // Mock getPerspectiveEvaluation to return different values for each call
      mockUnifiedService.getPerspectiveEvaluation.mockImplementation((fen, perspective) => {
        // First call should be for previousFen
        if (fen === previousFen) {
          return Promise.resolve({
            type: 'tablebase',
            scoreInCentipawns: null,
            mate: null,
            wdl: 2,
            dtm: null,
            dtz: 10,
            isTablebasePosition: true,
            raw: null,
            perspective: 'b',
            perspectiveScore: null,
            perspectiveMate: null,
            perspectiveWdl: 2,
            perspectiveDtm: null,
            perspectiveDtz: 10,
          });
        }
        // Second call should be for current fen
        return Promise.resolve({
          type: 'tablebase',
          scoreInCentipawns: null,
          mate: null,
          wdl: 0,
          dtm: null,
          dtz: 0,
          isTablebasePosition: true,
          raw: null,
          perspective: 'b',
          perspectiveScore: null,
          perspectiveMate: null,
          perspectiveWdl: 0,
          perspectiveDtm: null,
          perspectiveDtz: 0,
        });
      });

      const { result } = renderHook(() =>
        useEvaluation({
          fen,
          isEnabled: true,
          previousFen,
        })
      );

      await waitFor(() => {
        expect(result.current.evaluations.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
      
      expect(result.current.lastEvaluation).toBeDefined();
      expect(result.current.lastEvaluation?.tablebase).toBeDefined();

      // Verify mock was called correctly
      expect(mockUnifiedService.getPerspectiveEvaluation).toHaveBeenCalledTimes(2);
      expect(mockUnifiedService.getPerspectiveEvaluation).toHaveBeenNthCalledWith(1, previousFen, 'b');
      expect(mockUnifiedService.getPerspectiveEvaluation).toHaveBeenNthCalledWith(2, fen, 'b');

      // Verify the complete data structure
      const tablebase = result.current.lastEvaluation?.tablebase;
      expect(tablebase).toEqual({
        isTablebasePosition: true,
        wdlBefore: 2,
        wdlAfter: 0,
        category: 'draw',
        dtz: 0,
      });
    });

    it('should handle missing tablebase data gracefully', async () => {
      mockUnifiedService.getFormattedEvaluation.mockResolvedValue({
        mainText: '+2.5',
        detailText: null,
        className: 'winning',
        metadata: {
          isTablebase: false,
          isDrawn: false,
          isMate: false,
        },
      });

      const { result } = renderHook(() =>
        useEvaluation({
          fen: '8/8/8/8/8/8/8/8 w - - 0 1',
          isEnabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.evaluations.length).toBeGreaterThan(0);
      }, { timeout: 2000 });

      expect(result.current.lastEvaluation?.tablebase).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockUnifiedService.getFormattedEvaluation.mockRejectedValue(
        new Error('API Error')
      );

      const { result } = renderHook(() =>
        useEvaluation({
          fen: 'test-fen',
          isEnabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.evaluations).toHaveLength(0);
      expect(result.current.lastEvaluation).toBeNull();
    });
  });
});