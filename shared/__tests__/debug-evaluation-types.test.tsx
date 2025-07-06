import { renderHook, act } from '@testing-library/react';
import { useEvaluation } from '@shared/hooks/useEvaluation';
import { UnifiedEvaluationService } from '@shared/lib/chess/evaluation/unifiedService';
import type { PlayerPerspectiveEvaluation } from '@shared/types/evaluation';

// Mock dependencies
jest.mock('@shared/lib/chess/evaluation/unifiedService');
jest.mock('@shared/lib/chess/evaluation/providerAdapters');
jest.mock('@shared/lib/cache/LRUCache');
jest.mock('@shared/lib/chess/evaluation/cacheAdapter');

describe('Debug Evaluation Types', () => {
  let mockService: jest.Mocked<UnifiedEvaluationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockService = {
      getFormattedEvaluation: jest.fn(),
      getPerspectiveEvaluation: jest.fn(),
      getFormattedDualEvaluation: jest.fn(),
    } as any;

    jest.spyOn(UnifiedEvaluationService.prototype, 'getFormattedEvaluation')
      .mockImplementation(mockService.getFormattedEvaluation);
    jest.spyOn(UnifiedEvaluationService.prototype, 'getPerspectiveEvaluation')
      .mockImplementation(mockService.getPerspectiveEvaluation);
  });

  it('should check what useEvaluation actually returns in evaluations array', async () => {
    const previousFen = '8/8/3K4/8/8/8/4r3/7k w - - 0 1';
    const currentFen = '8/3K4/8/8/8/8/4r3/7k b - - 1 1';

    // Mock tablebase response
    mockService.getFormattedEvaluation.mockResolvedValue({
      mainText: 'TB Win',
      detailText: 'DTM: 10',
      className: 'winning',
      metadata: {
        isTablebase: true,
        isMate: false,
        isDrawn: false
      }
    });

    mockService.getPerspectiveEvaluation
      .mockResolvedValueOnce({
        type: 'tablebase',
        wdl: 2,
        perspectiveWdl: 2,
        isTablebasePosition: true,
        perspective: 'w',
        scoreInCentipawns: null,
        mate: null,
        dtm: null,
        dtz: null,
        raw: null,
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      } as PlayerPerspectiveEvaluation)
      .mockResolvedValueOnce({
        type: 'tablebase',
        wdl: 2,
        perspectiveWdl: 2,
        isTablebasePosition: true,
        perspective: 'w',
        scoreInCentipawns: null,
        mate: null,
        dtm: null,
        dtz: null,
        raw: null,
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      } as PlayerPerspectiveEvaluation);

    const { result } = renderHook(() => useEvaluation({
      fen: currentFen,
      isEnabled: true,
      previousFen: previousFen
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Log the complete structure
    console.log('=== useEvaluation Hook Results ===');
    console.log('evaluations array:', JSON.stringify(result.current.evaluations, null, 2));
    console.log('lastEvaluation:', JSON.stringify(result.current.lastEvaluation, null, 2));
    console.log('evaluations.length:', result.current.evaluations.length);
    
    // Check the types
    result.current.evaluations.forEach((evalItem, index) => {
      console.log(`\nEvaluation ${index}:`);
      console.log('Has evaluation prop:', 'evaluation' in evalItem);
      console.log('Has tablebase prop:', 'tablebase' in evalItem);
      console.log('Has mateInMoves prop:', 'mateInMoves' in evalItem);
      console.log('Full object:', evalItem);
    });

    expect(result.current.evaluations.length).toBeGreaterThan(0);
  });

  it('should trace addEvaluation calls', async () => {
    const previousFen = '8/8/3K4/8/8/8/4r3/7k w - - 0 1';
    const currentFen = '8/3K4/8/8/8/8/4r3/7k b - - 1 1';

    // Mock responses
    mockService.getFormattedEvaluation.mockResolvedValue({
      mainText: 'TB Win',
      detailText: 'DTM: 10',
      className: 'winning',
      metadata: {
        isTablebase: true,
        isMate: false,
        isDrawn: false
      }
    });

    mockService.getPerspectiveEvaluation.mockResolvedValue({
      type: 'tablebase',
      wdl: 2,
      perspectiveWdl: 2,
      isTablebasePosition: true,
      perspective: 'w',
      scoreInCentipawns: null,
      mate: null,
      dtm: null,
      dtz: null,
      raw: null,
      perspectiveScore: null,
      perspectiveMate: null,
      perspectiveDtm: null,
      perspectiveDtz: null
    } as PlayerPerspectiveEvaluation);

    // Spy on the internal addEvaluation function
    const addEvaluationSpy = jest.fn();
    
    const { result } = renderHook(() => {
      const hookResult = useEvaluation({
        fen: currentFen,
        isEnabled: true,
        previousFen: previousFen
      });
      
      // Intercept addEvaluation calls
      const originalAddEvaluation = hookResult.addEvaluation;
      hookResult.addEvaluation = (evalData) => {
        console.log('addEvaluation called with:', JSON.stringify(evalData, null, 2));
        addEvaluationSpy(evalData);
        originalAddEvaluation(evalData);
      };
      
      return hookResult;
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    console.log('addEvaluation was called', addEvaluationSpy.mock.calls.length, 'times');
    if (addEvaluationSpy.mock.calls.length > 0) {
      console.log('Last call data:', JSON.stringify(addEvaluationSpy.mock.calls[0][0], null, 2));
    }
  });
});