/**
 * Integration tests for MovePanelZustand with tablebase evaluations
 * Tests that move symbols are correctly displayed based on tablebase data
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MovePanelZustand } from '../../../shared/components/training/MovePanelZustand';
import { useTraining } from '../../../shared/store/store';
import { Move } from 'chess.js';

// Mock the store module
jest.mock('../../../shared/store/store', () => ({
  useTraining: jest.fn()
}));

describe('MovePanelZustand Integration Tests', () => {
  const mockMove = (san: string): Move => ({
    color: 'w',
    from: 'e2',
    to: 'e4',
    flags: 'n',
    piece: 'p',
    san,
    captured: undefined,
    promotion: undefined
  } as Move);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tablebase Symbol Display', () => {
    test('should display catastrophic symbol (🚨) for win to draw', () => {
      // Mock the useTraining hook directly
      (useTraining as jest.Mock).mockReturnValue({
        moveHistory: [mockMove('Kd5')],
        evaluations: [
          // Initial position (before any moves)
          {
            evaluation: 0,
            tablebase: {
              isTablebasePosition: true,
              wdlBefore: 2,
              wdlAfter: 2
            }
          },
          // After Kd5 - catastrophic move!
          {
            evaluation: 0,
            tablebase: {
              isTablebasePosition: true,
              wdlBefore: 2, // Was winning (White's perspective)
              wdlAfter: 0,  // Now draw (Black's perspective after move, so 0 is draw)
              category: 'draw'
            }
          }
        ]
      });

      render(<MovePanelZustand showEvaluations={true} />);

      // Check that the catastrophic symbol is displayed
      expect(screen.getByText('🚨')).toBeInTheDocument();
    });

    test('should display excellent symbol (✅) for maintaining win', () => {
      (useTraining as jest.Mock).mockReturnValue({
            moveHistory: [mockMove('Kc6')],
            evaluations: [
              // Initial position
              {
                evaluation: 0,
                tablebase: {
                  isTablebasePosition: true,
                  wdlBefore: 2,
                  wdlAfter: 2
                }
              },
              // After Kc6 - good move!
              {
                evaluation: 0,
                tablebase: {
                  isTablebasePosition: true,
                  wdlBefore: 2, // Was winning (White's perspective)
                  wdlAfter: -2, // Still winning (Black's perspective, so -2 = Black loses)
                  category: 'win'
                }
              }
            ]
      });

      render(<MovePanelZustand showEvaluations={true} />);

      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    test('should display target symbol (🎯) for improving from draw to win', () => {
      (useTraining as jest.Mock).mockReturnValue({
            moveHistory: [mockMove('Re4')],
            evaluations: [
              // Initial position
              {
                evaluation: 0,
                tablebase: {
                  isTablebasePosition: true,
                  wdlBefore: 0,
                  wdlAfter: 0
                }
              },
              // After Re4 - improved!
              {
                evaluation: 0,
                tablebase: {
                  isTablebasePosition: true,
                  wdlBefore: 0, // Was draw (White's perspective)
                  wdlAfter: -2, // Now winning! (Black's perspective, so -2 = Black loses)
                  category: 'win'
                }
              }
            ]
      });

      render(<MovePanelZustand showEvaluations={true} />);

      expect(screen.getByText('🎯')).toBeInTheDocument();
    });

    test('should handle Black perspective correctly', () => {
      (useTraining as jest.Mock).mockReturnValue({
            moveHistory: [
              mockMove('Kc6'),
              { ...mockMove('Kb7'), color: 'b' } as Move
            ],
            evaluations: [
              // Initial position
              { evaluation: 0 },
              // After White's Kc6
              { evaluation: 0 },
              // After Black's Kb7
              {
                evaluation: 0,
                tablebase: {
                  isTablebasePosition: true,
                  wdlBefore: -2, // Black losing (from White's perspective)
                  wdlAfter: 0,   // Now draw
                  category: 'draw'
                }
              }
            ]
      });

      render(<MovePanelZustand showEvaluations={true} />);

      // Black improved from loss to draw - should show good symbol
      expect(screen.getByText('👍')).toBeInTheDocument();
    });
  });

  describe('Engine Fallback', () => {
    test('should fall back to engine symbols when no tablebase data', () => {
      (useTraining as jest.Mock).mockReturnValue({
            moveHistory: [mockMove('e4')],
            evaluations: [
              // Initial position
              { evaluation: 0.15 },
              // After e4 - no tablebase data
              {
                evaluation: 2.5,
                mateInMoves: undefined
              }
            ]
      });

      render(<MovePanelZustand showEvaluations={true} />);

      // Should show engine-based symbol
      expect(screen.getByText('✨')).toBeInTheDocument();
    });

    test('should show mate symbol when mate detected', () => {
      (useTraining as jest.Mock).mockReturnValue({
            moveHistory: [mockMove('Qh5#')],
            evaluations: [
              // Initial position
              { evaluation: 5.0 },
              // After Qh5# - checkmate!
              {
                evaluation: 0,
                mateInMoves: 1  // Mate in 1 (not 0)
              }
            ]
      });

      render(<MovePanelZustand showEvaluations={true} />);

      // Should show mate symbol
      expect(screen.getByText('#1')).toBeInTheDocument();
    });
  });

  describe('UI Behavior', () => {
    test('should not show symbols when showEvaluations is false', () => {
      (useTraining as jest.Mock).mockReturnValue({
            moveHistory: [mockMove('Kd5')],
            evaluations: [
              { evaluation: 0 },
              {
                evaluation: 0,
                tablebase: {
                  isTablebasePosition: true,
                  wdlBefore: 2,
                  wdlAfter: 0
                }
              }
            ]
      });

      render(<MovePanelZustand showEvaluations={false} />);

      // Symbol should not be displayed
      expect(screen.queryByText('🚨')).not.toBeInTheDocument();
      // But move should be displayed
      expect(screen.getByText('Kd5')).toBeInTheDocument();
    });

    test('should handle empty move history gracefully', () => {
      (useTraining as jest.Mock).mockReturnValue({
            moveHistory: [],
            evaluations: []
      });

      render(<MovePanelZustand showEvaluations={true} />);

      expect(screen.getByText('Noch keine Züge gespielt')).toBeInTheDocument();
    });
  });
});