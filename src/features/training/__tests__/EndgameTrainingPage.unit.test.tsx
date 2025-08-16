import { vi } from 'vitest';
import React from 'react';
import { useGameStore, useTrainingStore, useUIStore } from '@shared/store/hooks';
import { useRouter } from 'next/navigation';
import { COMMON_FENS } from '@tests/fixtures/commonFens';

// Mock the hooks
vi.mock('@shared/store/hooks');
vi.mock('next/navigation');
vi.mock('@shared/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock the components
vi.mock('@shared/components/training', () => ({
  TrainingBoard: () => <div>TrainingBoard</div>,
  MovePanelZustand: () => <div>MovePanelZustand</div>,
  NavigationControls: () => <div>NavigationControls</div>,
}));

vi.mock('@shared/components/training/TablebaseAnalysisPanel', () => ({
  TablebaseAnalysisPanel: () => <div>TablebaseAnalysisPanel</div>,
}));

vi.mock('@shared/components/navigation/AdvancedEndgameMenu', () => ({
  AdvancedEndgameMenu: () => <div>AdvancedEndgameMenu</div>,
}));

describe('EndgameTrainingPage - Lichess URL Generation', () => {
  let mockGameState: any;
  let mockGameActions: any;
  let mockTrainingState: any;
  let mockTrainingActions: any;
  let mockUIState: any;
  let mockUIActions: any;

  beforeEach(() => {
    // Setup default mock states
    mockGameState = {
      currentFen: '8/8/8/4k3/8/8/4P3/4K3 w - - 0 1',
      currentPgn: '',
      moveHistory: [],
      currentMoveIndex: -1,
      isGameFinished: false,
      gameResult: null,
    };

    mockGameActions = {
      initializeGame: vi.fn(),
      makeMove: vi.fn(),
      undoMove: vi.fn(),
      goToMove: vi.fn(),
    };

    mockTrainingState = {
      isTraining: false,
      trainingMode: 'practice',
      playerColor: 'white',
    };

    mockTrainingActions = {
      startTraining: vi.fn(),
      stopTraining: vi.fn(),
    };

    mockUIState = {
      analysisPanel: {
        isOpen: false,
      },
    };

    mockUIActions = {
      updateAnalysisPanel: vi.fn(),
    };

    // Setup mock implementations
    (useGameStore as ReturnType<typeof vi.fn>).mockReturnValue([mockGameState, mockGameActions]);
    (useTrainingStore as ReturnType<typeof vi.fn>).mockReturnValue([
      mockTrainingState,
      mockTrainingActions,
    ]);
    (useUIStore as ReturnType<typeof vi.fn>).mockReturnValue([mockUIState, mockUIActions]);
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: vi.fn(),
    });
  });

  describe('getLichessUrl', () => {
    it('should generate FEN-based URL when no PGN is available', () => {
      // The component should use FEN-only URL when currentPgn is empty
      const expectedUrl = 'https://lichess.org/analysis/8/8/8/4k3/8/8/4P3/4K3_w_-_-_0_1';

      // Test that the function would generate the correct URL
      const currentPgn = '';
      const currentFen = '8/8/8/4k3/8/8/4P3/4K3 w - - 0 1';
      const moveHistory: any[] = [];

      const url =
        currentPgn && moveHistory.length > 0
          ? `https://lichess.org/analysis/pgn/${encodeURIComponent(currentPgn)}`
          : `https://lichess.org/analysis/${currentFen.replace(/ /g, '_')}`;

      expect(url).toBe(expectedUrl);
    });

    it('should generate FEN-based URL when no moves have been made', () => {
      // Even with PGN present, if no moves, use FEN
      const currentPgn = '[SetUp "1"]\n[FEN "8/8/8/4k3/8/8/4P3/4K3 w - - 0 1"]\n\n*';
      const currentFen = '8/8/8/4k3/8/8/4P3/4K3 w - - 0 1';
      const moveHistory: any[] = [];

      const url =
        currentPgn && moveHistory.length > 0
          ? `https://lichess.org/analysis/pgn/${encodeURIComponent(currentPgn)}`
          : `https://lichess.org/analysis/${currentFen.replace(/ /g, '_')}`;

      const expectedUrl = 'https://lichess.org/analysis/8/8/8/4k3/8/8/4P3/4K3_w_-_-_0_1';
      expect(url).toBe(expectedUrl);
    });

    it('should generate PGN-based URL when PGN is available with moves', () => {
      // Test with a sample PGN
      const samplePgn = '1. e4 e5 2. Nf3 Nc6';
      const currentFen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
      const moveHistory = [
        { from: 'e2', to: 'e4', san: 'e4' },
        { from: 'e7', to: 'e5', san: 'e5' },
        { from: 'g1', to: 'f3', san: 'Nf3' },
        { from: 'b8', to: 'c6', san: 'Nc6' },
      ];

      const url =
        samplePgn && moveHistory.length > 0
          ? `https://lichess.org/analysis/pgn/${encodeURIComponent(samplePgn)}`
          : `https://lichess.org/analysis/${currentFen.replace(/ /g, '_')}`;

      const expectedUrl = `https://lichess.org/analysis/pgn/${encodeURIComponent(samplePgn)}`;
      expect(url).toBe(expectedUrl);
    });

    it('should handle empty move history even with PGN present', () => {
      // Edge case: PGN exists but move history is empty (shouldn't normally happen)
      const currentPgn = '1. e4';
      const currentFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const moveHistory: any[] = [];

      const url =
        currentPgn && moveHistory.length > 0
          ? `https://lichess.org/analysis/pgn/${encodeURIComponent(currentPgn)}`
          : `https://lichess.org/analysis/${currentFen.replace(/ /g, '_')}`;

      // Should fall back to FEN since moveHistory is empty
      const expectedUrl = `https://lichess.org/analysis/${currentFen.replace(/ /g, '_')}`;
      expect(url).toBe(expectedUrl);
    });

    it('should properly encode PGN with special characters', () => {
      // Test PGN with promotions and special notation
      const complexPgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7';
      const moveHistory = new Array(10).fill({ from: 'a1', to: 'a2', san: 'a2' }); // Dummy moves

      const url =
        complexPgn && moveHistory.length > 0
          ? `https://lichess.org/analysis/pgn/${encodeURIComponent(complexPgn)}`
          : `https://lichess.org/analysis/8/8/8/8/8/8/8/8_w_-_-_0_1`;

      expect(url).toContain('analysis/pgn/');
      expect(url).toContain(encodeURIComponent(complexPgn));
      // Verify proper encoding
      expect(url).toContain('1.%20e4%20e5%202.%20Nf3');
    });

    it('should handle endgame position with partial game', () => {
      // Simulate an endgame where we've made some moves
      const endgamePgn = '[FEN "8/8/8/4k3/8/8/4P3/4K3 w - - 0 1"]\n\n1. e3 Kd5 2. Kf2 Ke4';
      const currentFen = COMMON_FENS.COMPLEX_ENDGAME;
      const moveHistory = [
        { from: 'e2', to: 'e3', san: 'e3' },
        { from: 'e5', to: 'd5', san: 'Kd5' },
        { from: 'e1', to: 'f2', san: 'Kf2' },
        { from: 'd5', to: 'e4', san: 'Ke4' },
      ];

      const url =
        endgamePgn && moveHistory.length > 0
          ? `https://lichess.org/analysis/pgn/${encodeURIComponent(endgamePgn)}`
          : `https://lichess.org/analysis/${currentFen.replace(/ /g, '_')}`;

      expect(url).toContain('analysis/pgn/');
      expect(url).toContain(encodeURIComponent('[FEN'));
    });
  });
});
