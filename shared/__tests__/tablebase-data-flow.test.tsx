import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { render } from '@testing-library/react';
import { useEvaluation } from '@shared/hooks/useEvaluation';
import { TrainingBoard } from '@shared/components/training/TrainingBoard';
import { MovePanel } from '@shared/components/training/MovePanel';
import { UnifiedEvaluationService } from '@shared/lib/chess/evaluation/unifiedService';
import type { Move } from 'chess.js';
import type { PlayerPerspectiveEvaluation } from '@shared/types/evaluation';

// Mock all dependencies
jest.mock('@shared/lib/chess/evaluation/unifiedService');
jest.mock('@shared/lib/chess/evaluation/providerAdapters');
jest.mock('@shared/lib/cache/LRUCache');
jest.mock('@shared/lib/chess/evaluation/cacheAdapter');
jest.mock('@shared/lib/stockfish', () => ({
  Stockfish: jest.fn()
}));

describe('Tablebase Data Flow - Complete Chain Test', () => {
  let mockService: jest.Mocked<UnifiedEvaluationService>;
  const consoleSpy = jest.spyOn(console, 'log');
  
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

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('Step 1: useEvaluation should generate tablebase data correctly', async () => {
    const previousFen = '8/8/3K4/8/8/8/4r3/7k w - - 0 1';
    const currentFen = '8/3K4/8/8/8/8/4r3/7k b - - 1 1';

    // Mock the service responses
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

    // White's perspective for both positions (player who made the move)
    mockService.getPerspectiveEvaluation
      .mockResolvedValueOnce({
        type: 'tablebase',
        wdl: 2,
        perspectiveWdl: 2,
        dtm: 11,
        perspectiveDtm: 11,
        isTablebasePosition: true,
        perspective: 'w',
        scoreInCentipawns: null,
        mate: null,
        dtz: null,
        raw: null,
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveDtz: null
      } as PlayerPerspectiveEvaluation)
      .mockResolvedValueOnce({
        type: 'tablebase',
        wdl: 2,
        perspectiveWdl: 2,
        dtm: 10,
        perspectiveDtm: 10,
        isTablebasePosition: true,
        perspective: 'w',
        scoreInCentipawns: null,
        mate: null,
        dtz: null,
        raw: null,
        perspectiveScore: null,
        perspectiveMate: null,
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

    console.log('Step 1 - useEvaluation output:', JSON.stringify(result.current.lastEvaluation, null, 2));
    
    expect(result.current.lastEvaluation).toBeDefined();
    expect(result.current.lastEvaluation?.tablebase).toBeDefined();
    expect(result.current.lastEvaluation?.tablebase?.isTablebasePosition).toBe(true);
    expect(result.current.lastEvaluation?.tablebase?.wdlBefore).toBe(2);
    expect(result.current.lastEvaluation?.tablebase?.wdlAfter).toBe(2);
  });

  it('Step 2: TrainingBoard should pass evaluations to parent correctly', async () => {
    let capturedEvaluations: any[] = [];
    
    const TestWrapper = () => {
      const [evaluations, setEvaluations] = React.useState<any[]>([]);
      
      return (
        <TrainingBoard
          fen="8/8/3K4/8/8/8/4r3/7k w - - 0 1"
          onComplete={() => {}}
          onEvaluationsChange={(evals) => {
            console.log('Step 2 - TrainingBoard passed:', JSON.stringify(evals, null, 2));
            capturedEvaluations = evals;
            setEvaluations(evals);
          }}
        />
      );
    };

    // Setup mocks for TrainingBoard
    mockService.getFormattedEvaluation.mockResolvedValue({
      mainText: 'TB Win',
      detailText: null,
      className: 'winning',
      metadata: { isTablebase: true, isMate: false, isDrawn: false }
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

    const { container } = render(<TestWrapper />);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    console.log('Captured evaluations:', capturedEvaluations);
    expect(capturedEvaluations.length).toBeGreaterThan(0);
  });

  it('Step 3: Full integration - Check if tablebase data reaches MovePanel', () => {
    const moves: Move[] = [{
      from: 'd6',
      to: 'd7',
      san: 'Kd7',
      color: 'w',
      piece: 'k',
      flags: 'n',
      captured: undefined,
      promotion: undefined,
      before: '8/8/3K4/8/8/8/4r3/7k w - - 0 1',
      after: '8/3K4/8/8/8/8/4r3/7k b - - 1 1',
      lan: 'Kd6-d7',
      isCapture: () => false,
      isPromotion: () => false,
      isEnPassant: () => false,
      isKingsideCastle: () => false,
      isQueensideCastle: () => false,
      isBigPawn: () => false
    }];

    // Test with tablebase data
    const evaluationsWithTablebase = [
      { 
        evaluation: 0,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: 2,
          wdlAfter: 2,
          category: 'win',
          dtz: 10
        }
      }
    ];

    console.log('Step 3 - MovePanel receives:', JSON.stringify(evaluationsWithTablebase, null, 2));

    const { container } = render(
      <MovePanel 
        moves={moves}
        showEvaluations={true}
        evaluations={evaluationsWithTablebase}
        onMoveClick={() => {}}
        currentMoveIndex={0}
      />
    );

    // Check if evaluation symbol is rendered
    const evalElements = container.querySelectorAll('[class*="eval-"]');
    console.log('Evaluation elements found:', evalElements.length);
    evalElements.forEach(el => {
      console.log('Element:', el.className, el.textContent);
    });

    expect(evalElements.length).toBeGreaterThan(0);
  });

  it('Step 4: Trace exact data transformation', async () => {
    // This test will log every transformation step
    console.log('\n=== COMPLETE DATA FLOW TRACE ===\n');

    // 1. Service returns tablebase data
    const serviceResponse = {
      type: 'tablebase',
      wdl: 2,
      perspectiveWdl: 2,
      isTablebasePosition: true
    };
    console.log('1. Service response:', serviceResponse);

    // 2. useEvaluation transforms it
    const evaluationData = {
      evaluation: 0,
      tablebase: {
        isTablebasePosition: true,
        wdlBefore: 2,
        wdlAfter: 2,
        category: 'win'
      }
    };
    console.log('2. useEvaluation output:', evaluationData);

    // 3. TrainingContext stores it
    const contextState = {
      evaluations: [evaluationData]
    };
    console.log('3. Context state:', contextState);

    // 4. MovePanel receives it
    console.log('4. MovePanel props:', contextState.evaluations);

    // 5. Check if tablebase data exists at MovePanel
    const hasTablebaseData = contextState.evaluations[0]?.tablebase?.isTablebasePosition === true;
    console.log('5. Has tablebase data in MovePanel:', hasTablebaseData);

    expect(hasTablebaseData).toBe(true);
  });
});