/**
 * @file TrainingSession Tests
 * @description Tests for the training layer built on ChessGame
 */

import { describe, it, expect } from 'vitest';
import { TrainingSession } from '../TrainingSession';

describe('TrainingSession', () => {
  describe('Training Mode (Player vs Engine)', () => {
    it('should block black moves when player is white', () => {
      const session = new TrainingSession(undefined, {
        mode: 'training',
        playerColor: 'white',
        engineEnabled: true,
        moveSequence: ['e4', 'e5', 'Nf3', 'Nc6'] // Add predefined sequence
      });

      // White move should work (player's turn)
      const whiteMove = session.makeMove({ from: 'e2', to: 'e4' });
      expect(whiteMove.success).toBe(true);
      expect(whiteMove.shouldScheduleEngine).toBe(true); // Engine should respond from sequence

      // Black move should be blocked (engine's turn)
      const blackMove = session.makeMove({ from: 'e7', to: 'e5' });
      expect(blackMove.success).toBe(false);
      expect(blackMove.error).toContain('Not your turn');
    });

    it('should block white moves when player is black', () => {
      const session = new TrainingSession(undefined, {
        mode: 'training',
        playerColor: 'black',
        engineEnabled: true
      });

      // White move should be blocked (engine's turn)
      const whiteMove = session.makeMove({ from: 'e2', to: 'e4' });
      expect(whiteMove.success).toBe(false);
      expect(whiteMove.error).toContain('Not your turn');
    });

    it('should allow engine moves', () => {
      const session = new TrainingSession(undefined, {
        mode: 'training',
        playerColor: 'white',
        engineEnabled: true
      });

      // Player move
      session.makeMove({ from: 'e2', to: 'e4' });

      // Engine move should work
      const engineMove = session.makeEngineMove({ from: 'e7', to: 'e5' });
      expect(engineMove.success).toBe(true);
      expect(engineMove.isPlayerTurn).toBe(true); // Back to player's turn
    });
  });

  describe('Manual Mode (Both Sides Manual)', () => {
    it('should allow both white and black moves', () => {
      const session = new TrainingSession(undefined, {
        mode: 'manual',
        playerColor: 'white',
        engineEnabled: false
      });

      // White move
      const whiteMove = session.makeMove({ from: 'e2', to: 'e4' });
      expect(whiteMove.success).toBe(true);
      expect(whiteMove.isPlayerTurn).toBe(true);
      expect(whiteMove.shouldScheduleEngine).toBe(false);

      // Black move - THIS SHOULD WORK IN MANUAL MODE!
      const blackMove = session.makeMove({ from: 'e7', to: 'e5' });
      expect(blackMove.success).toBe(true);
      expect(blackMove.isPlayerTurn).toBe(true);
      expect(blackMove.shouldScheduleEngine).toBe(false);

      console.log('✅ MANUAL MODE: Both colors work!');
    });

    it('should handle the failing E2E test sequence', () => {
      // Manual mode with Opposition Grundlagen position
      const session = new TrainingSession('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', {
        mode: 'manual',
        playerColor: 'white',
        engineEnabled: false
      });

      // Execute the full sequence that was failing
      const moves = [
        { from: 'e6', to: 'f6' }, // Kf6 (white)
        { from: 'e8', to: 'f8' }, // Kf8 (black) - This was blocked!
        { from: 'e5', to: 'e6' }, // e6 (white)  
        { from: 'f8', to: 'e8' }, // Ke8 (black)
        { from: 'e6', to: 'e7' }  // e7 (white)
      ];

      for (let i = 0; i < moves.length; i++) {
        const result = session.makeMove(moves[i]);
        expect(result.success).toBe(true);
        console.log(`Move ${i + 1}: ${moves[i].from}→${moves[i].to} ✅`);
      }

      expect(session.getFen()).toBe('4k3/4P3/5K2/8/8/8/8/8 b - - 0 3');
      console.log('✅ FULL E2E SEQUENCE WORKS IN MANUAL MODE!');
    });
  });

  describe('Mode Switching', () => {
    it('should switch between training and manual modes', () => {
      const session = new TrainingSession(undefined, {
        mode: 'training',
        playerColor: 'white',
        engineEnabled: true
      });

      // In training mode, black moves blocked
      session.makeMove({ from: 'e2', to: 'e4' });
      let blackMove = session.makeMove({ from: 'e7', to: 'e5' });
      expect(blackMove.success).toBe(false);

      // Switch to manual mode
      session.setMode('manual');

      // Now black moves should work
      blackMove = session.makeMove({ from: 'e7', to: 'e5' });
      expect(blackMove.success).toBe(true);
      console.log('✅ Mode switching works!');
    });
  });

  describe('Integration with ChessGame', () => {
    it('should delegate chess logic correctly', () => {
      const session = new TrainingSession();

      // All ChessGame functionality should work
      expect(session.getFen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(session.getTurn()).toBe('white');
      expect(session.isGameOver()).toBe(false);
      expect(session.getMoves()).toContain('e4');

      // Move and verify delegation
      session.makeMove({ from: 'e2', to: 'e4' });
      expect(session.getHistory()).toHaveLength(1);
    });
  });
});