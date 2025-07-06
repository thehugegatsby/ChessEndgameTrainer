import { getMoveQualityByTablebaseComparison } from '@/utils/chess/evaluationHelpers';
import { queryTablebase } from '@/services/tablebaseService';
import { renderHook, waitFor } from '@testing-library/react';
import { useEvaluation } from '@/hooks/useEvaluation';

jest.mock('@/services/tablebaseService');

describe('Tablebase Evaluation Chain Integration', () => {
  const mockQueryTablebase = queryTablebase as jest.MockedFunction<typeof queryTablebase>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Critical Regression Tests', () => {
    test('knownBlunderCase_Td4AfterKb5_shouldShowRedTriangle', async () => {
      // Setup: Das exakte Szenario aus dem Screenshot
      const positionBeforeBlunder = "8/8/8/1k6/3R4/8/8/3K4 w - - 0 1";
      const blunderMove = { from: 'd4', to: 'd4' }; // Td4 (keeping rook on d4)
      
      // Mock Tablebase responses
      mockQueryTablebase
        .mockResolvedValueOnce({ wdl: 2, dtm: 10 }) // Before: White winning
        .mockResolvedValueOnce({ wdl: 0, dtm: 0 }); // After: Draw!

      // Test evaluation function directly
      const evaluation = getMoveQualityByTablebaseComparison(2, 0, 'w');
      expect(evaluation.text).toBe('🔻');
      expect(evaluation.className).toBe('eval-blunder');

      // Test through hook
      const { result } = renderHook(() => 
        useEvaluation(positionBeforeBlunder, 'w')
      );

      await waitFor(() => {
        expect(result.current.tablebaseData?.wdlBefore).toBe(2);
      });

      // Simulate the blunder move
      const moveEval = await result.current.evaluateMove(
        positionBeforeBlunder,
        "8/8/8/1k6/3R4/8/8/3K4 b - - 0 1" // After Td4
      );

      expect(moveEval.symbol).toBe('🔻');
      expect(moveEval.className).toBe('eval-blunder');
    });

    test('blackOptimalDefense_maintainingLoss_shouldShowShield', async () => {
      const losingPosition = "8/8/8/8/3K4/3R4/3k4/8 b - - 0 1";
      const defensiveMove = { from: 'e2', to: 'e1' };

      mockQueryTablebase
        .mockResolvedValueOnce({ wdl: -2, dtm: -15 }) // Before: Black losing
        .mockResolvedValueOnce({ wdl: -2, dtm: -15 }); // After: Still losing (optimal)

      const evaluation = getMoveQualityByTablebaseComparison(-2, -2, 'b');
      expect(evaluation.text).toBe('🛡️');
      expect(evaluation.className).toBe('eval-neutral');
    });

    test('winToWinOptimal_dtmImprovement_shouldShowCheckmark', async () => {
      mockQueryTablebase
        .mockResolvedValueOnce({ wdl: 2, dtm: 15 })
        .mockResolvedValueOnce({ wdl: 2, dtm: 14 });

      const evaluation = getMoveQualityByTablebaseComparison(2, 2, 'w');
      expect(evaluation.text).toBe('✓');
      expect(evaluation.className).toBe('eval-good');
    });
  });

  describe('Edge Cases', () => {
    test('tablebaseUnavailable_shouldHandleGracefully', async () => {
      mockQueryTablebase.mockResolvedValue(null);

      const { result } = renderHook(() => 
        useEvaluation("8/8/8/8/8/8/8/8 w - - 0 1", 'w')
      );

      await waitFor(() => {
        expect(result.current.tablebaseData).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    test('networkError_shouldRetryAndFallback', async () => {
      mockQueryTablebase
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ wdl: 0, dtm: 0 });

      const { result } = renderHook(() => 
        useEvaluation("8/8/8/8/3K4/3R4/3k4/8 w - - 0 1", 'w')
      );

      await waitFor(() => {
        expect(result.current.tablebaseData?.wdl).toBe(0);
      });

      expect(mockQueryTablebase).toHaveBeenCalledTimes(2);
    });
  });
});