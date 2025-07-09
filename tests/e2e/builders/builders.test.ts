/**
 * @fileoverview Test Data Builders Tests
 * @description Verifies that all builders work correctly
 */

import { test, expect } from '@playwright/test';
import {
  aGameState,
  aPosition,
  aTrainingSession,
  TestScenarios,
  createFen,
} from './index';

test.describe('Test Data Builders', () => {
  
  test.describe('GameStateBuilder', () => {
    test('should create default game state', () => {
      const gameState = aGameState().build();
      
      expect(gameState.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(gameState.turn).toBe('w');
      expect(gameState.moveHistory).toEqual([]);
      expect(gameState.currentMoveIndex).toBe(0);
      expect(gameState.isGameOver).toBe(false);
    });
    
    test('should support fluent interface with immutability', () => {
      const builder1 = aGameState().withTurn('b');
      const builder2 = builder1.withEvaluation(1.5);
      
      const state1 = builder1.build();
      const state2 = builder2.build();
      
      expect(state1.evaluation).toBeUndefined();
      expect(state2.evaluation).toBe(1.5);
      expect(state1).not.toBe(state2);
    });
    
    test('should apply moves correctly', () => {
      const gameState = aGameState()
        .afterMoves(['e4', 'e5', 'Nf3'])
        .build();
      
      expect(gameState.moveHistory).toEqual(['e4', 'e5', 'Nf3']);
      expect(gameState.turn).toBe('b');
      expect(gameState.currentMoveIndex).toBe(3);
      expect(gameState.fen).toContain('rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R');
    });
    
    test('should create endgame positions', () => {
      const opposition = aGameState()
        .withEndgamePosition('opposition')
        .build();
      
      expect(opposition.fen).toBe('4k3/8/4K3/8/8/8/8/8 w - - 0 1');
    });
    
    test('should handle navigation through moves', () => {
      const gameState = aGameState()
        .afterMoves(['e4', 'e5', 'Nf3', 'Nc6'])
        .atMove(2)
        .build();
      
      expect(gameState.currentMoveIndex).toBe(2);
      expect(gameState.turn).toBe('b');
    });
    
    test('should validate invalid moves', () => {
      expect(() => {
        aGameState().afterMoves(['e5']).build(); // Invalid first move for white
      }).toThrow('Invalid move');
    });
  });
  
  test.describe('PositionBuilder', () => {
    test('should create default position', () => {
      const position = aPosition().build();
      
      expect(position.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(position.evaluation).toBeUndefined();
      expect(position.bestMove).toBeUndefined();
    });
    
    test('should create empty board', () => {
      const position = aPosition().empty().build();
      
      expect(position.fen).toBe('8/8/8/8/8/8/8/8 w - - 0 1');
      expect(position.description).toBe('Empty board');
    });
    
    test('should create theoretical positions', () => {
      const lucena = aPosition().theoreticalPosition('lucena').build();
      
      expect(lucena.fen).toBe('1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1');
      expect(lucena.description).toBe('Lucena position');
      expect(lucena.bestMove).toBe('Rd1+');
      expect(lucena.evaluation).toBe(500);
    });
    
    test('should place pieces correctly', () => {
      const position = aPosition()
        .withPieces([
          { piece: 'k', color: 'w', square: 'e1' },
          { piece: 'k', color: 'b', square: 'e8' },
          { piece: 'r', color: 'w', square: 'a1' },
          { piece: 'r', color: 'b', square: 'h8' },
        ])
        .build();
      
      expect(position.fen).toContain('r3k3');
      expect(position.fen).toContain('R3K3');
    });
    
    test('should validate best move', () => {
      expect(() => {
        aPosition()
          .withFen('4k3/8/4K3/8/8/8/8/8 w - - 0 1')
          .withBestMove('Nf3') // No knight on board
          .build();
      }).toThrow('Best move');
    });
  });
  
  test.describe('TrainingSessionBuilder', () => {
    test('should create default session', () => {
      const session = aTrainingSession()
        .addPosition(aPosition().kingOpposition().build())
        .build();
      
      expect(session.id).toContain('session-');
      expect(session.name).toBe('Unnamed Session');
      expect(session.positions).toHaveLength(1);
      expect(session.currentPositionIndex).toBe(0);
      expect(session.settings.showEvaluation).toBe(true);
      expect(session.settings.allowTakebacks).toBe(true);
    });
    
    test('should create opposition training', () => {
      const session = aTrainingSession()
        .oppositionTraining()
        .build();
      
      expect(session.name).toBe('King Opposition Training');
      expect(session.positions).toHaveLength(4);
      expect(session.settings.showBestMove).toBe(true);
      expect(session.settings.showEvaluation).toBe(false);
    });
    
    test('should apply difficulty settings', () => {
      const beginner = aTrainingSession()
        .withDifficulty('beginner')
        .addPosition(aPosition().build())
        .build();
      
      const advanced = aTrainingSession()
        .withDifficulty('advanced')
        .addPosition(aPosition().build())
        .build();
      
      expect(beginner.settings.showBestMove).toBe(true);
      expect(beginner.settings.timePerMove).toBeUndefined();
      
      expect(advanced.settings.showBestMove).toBe(false);
      expect(advanced.settings.timePerMove).toBe(30000);
      expect(advanced.settings.allowTakebacks).toBe(false);
    });
    
    test('should validate empty positions', () => {
      expect(() => {
        aTrainingSession().build();
      }).toThrow('at least one position');
    });
    
    test('should validate position index', () => {
      expect(() => {
        aTrainingSession()
          .addPosition(aPosition().build())
          .withCurrentPositionIndex(5)
          .build();
      }).toThrow('Invalid currentPositionIndex');
    });
  });
  
  test.describe('Test Scenarios', () => {
    test('should provide ready-to-use scenarios', () => {
      const newGame = TestScenarios.newGame().build();
      expect(newGame.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      const afterE4E5 = TestScenarios.afterE4E5().build();
      expect(afterE4E5.moveHistory).toEqual(['e4', 'e5']);
      
      const opposition = TestScenarios.kingOpposition().build();
      expect(opposition.fen).toBe('4k3/8/4K3/8/8/8/8/8 w - - 0 1');
      
      const quickTest = TestScenarios.quickTest().build();
      expect(quickTest.positions).toHaveLength(1);
      expect(quickTest.name).toBe('Quick Test Session');
    });
  });
  
  test.describe('Integration with Test Bridge', () => {
    test('builders should create data compatible with Test Bridge', async ({ page }) => {
      // This test verifies that builder output can be used with Test Bridge
      const gameState = aGameState()
        .withEndgamePosition('opposition')
        .withMockEngineResponse('Kf6', 0, 20)
        .build();
      
      // Verify the structure matches what Test Bridge expects
      expect(gameState.fen).toBeTruthy();
      expect(gameState.engineAnalysis).toBeTruthy();
      expect(gameState.engineAnalysis?.bestMove).toBe('Kf6');
      expect(gameState.engineAnalysis?.evaluation).toBe(0);
      
      // The actual Test Bridge integration would happen in E2E tests
      // This just verifies the data structure is correct
    });
  });
});