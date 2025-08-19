/**
 * @file ChessGame Tests
 * @description Tests für die neue, vereinfachte ChessGame Klasse
 */

import { describe, it, expect } from 'vitest';
import { ChessGame } from '../ChessGame';

describe('ChessGame', () => {
  describe('Basic Functionality', () => {
    it('should allow both white and black moves', () => {
      const game = new ChessGame();

      // White move
      const whiteMove = game.makeMove({ from: 'e2', to: 'e4' });
      expect(whiteMove.success).toBe(true);
      expect(whiteMove.turn).toBe('b'); // Now black's turn

      // Black move - THIS IS THE KEY TEST!
      const blackMove = game.makeMove({ from: 'e7', to: 'e5' });
      expect(blackMove.success).toBe(true);
      expect(blackMove.turn).toBe('w'); // Now white's turn

      console.log('✅ BOTH COLORS WORK! No more orchestrator blocking!');
    });

    it('should handle invalid moves correctly', () => {
      const game = new ChessGame();

      const invalidMove = game.makeMove({ from: 'e2', to: 'e8' }); // Invalid jump
      expect(invalidMove.success).toBe(false);
      expect(invalidMove.error).toBeDefined();
      expect(invalidMove.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); // Position unchanged
    });

    it('should detect game over states', () => {
      // Fool's mate position
      const game = new ChessGame();
      
      game.makeMove({ from: 'f2', to: 'f3' });
      game.makeMove({ from: 'e7', to: 'e5' });
      game.makeMove({ from: 'g2', to: 'g4' });
      const checkmate = game.makeMove({ from: 'd8', to: 'h4' });

      expect(checkmate.isCheckmate).toBe(true);
      expect(checkmate.isGameOver).toBe(true);
    });
  });

  describe('E2E Test Scenario', () => {
    it('should handle the exact sequence from our failing test', () => {
      // Opposition Grundlagen position
      const game = new ChessGame('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');

      // 1. Weiß: Kf6 - Opposition nehmen
      const kf6 = game.makeMove({ from: 'e6', to: 'f6' });
      expect(kf6.success).toBe(true);
      expect(kf6.fen).toBe('4k3/8/5K2/4P3/8/8/8/8 b - - 1 1');

      // 2. Schwarz: Kf8 - weicht aus
      // THIS WAS BLOCKED IN THE OLD SYSTEM!
      const kf8 = game.makeMove({ from: 'e8', to: 'f8' });
      expect(kf8.success).toBe(true);
      expect(kf8.fen).toBe('5k2/8/5K2/4P3/8/8/8/8 w - - 2 2');

      // 3. Weiß: e6 - Bauer vorrücken
      const e6 = game.makeMove({ from: 'e5', to: 'e6' });
      expect(e6.success).toBe(true);

      // 4. Schwarz: Ke8 - zurück
      const ke8 = game.makeMove({ from: 'f8', to: 'e8' });
      expect(ke8.success).toBe(true);

      // 5. Weiß: e7 - Fast gewonnen
      const e7 = game.makeMove({ from: 'e6', to: 'e7' });
      expect(e7.success).toBe(true);

      console.log('✅ COMPLETE SEQUENCE WORKS! No more training mode blocking!');
      console.log('Final FEN:', e7.fen);
    });
  });

  describe('Utility Methods', () => {
    it('should provide all chess.js functionality', () => {
      const game = new ChessGame();

      // Test basic queries
      expect(game.getTurn()).toBe('white');
      expect(game.getFen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(game.isGameOver()).toBe(false);
      expect(game.getMoves()).toContain('e4');

      // Test move and state change
      game.makeMove({ from: 'e2', to: 'e4' });
      expect(game.getTurn()).toBe('black');
      expect(game.getHistory()).toHaveLength(1);
    });

    it('should allow cloning and FEN loading', () => {
      const game1 = new ChessGame();
      game1.makeMove({ from: 'e2', to: 'e4' });

      const game2 = game1.clone();
      expect(game2.getFen()).toBe(game1.getFen());

      // Test FEN loading
      const game3 = new ChessGame();
      const loaded = game3.loadFen('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
      expect(loaded).toBe(true);
      expect(game3.getFen()).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
    });
  });
});