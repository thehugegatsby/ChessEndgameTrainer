/**
 * @fileoverview Tests for Engine Test Helper
 * @description Demonstrates and validates the test helper utilities
 */

import {
  createTestEngine,
  createRealisticTestEngine,
  cleanupAllEngines,
  waitForEngineReady,
  EngineTestScenario,
  engineTestUtils,
} from '../../helpers/engineTestHelper';
import { MockWorker } from '../../helpers/mockWorker';
import { Engine } from '@shared/lib/chess/engine/index';

// Use the test utilities
engineTestUtils.describeEngine('Engine Test Helper', () => {
  describe('createTestEngine', () => {
    it('should create engine with mock worker', async () => {
      const { engine, getMockWorker, cleanup } = await createTestEngine(
        {},
        { autoRespond: true }, // Enable for successful initialization
      );
      
      expect(engine).toBeDefined();
      expect(engine.isReady()).toBe(true); // Engine is ready after createTestEngine
      
      // Get mock worker
      const mockWorker = getMockWorker();
      expect(mockWorker).toBeDefined();
      expect(mockWorker).toBeInstanceOf(MockWorker);
      
      // Verify initialization commands were sent
      const messages = mockWorker!.getMessageQueue();
      expect(messages).toContain('uci');
      expect(messages).toContain('isready');
      
      // Test engine functionality
      const bestMove = await engine.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(bestMove).toBeDefined();
      
      cleanup();
    });

    it('should configure worker behavior', async () => {
      const { engine, getMockWorker, cleanup } = await createTestEngine(
        {},
        {
          autoRespond: true, // Enable for successful initialization
          responseDelay: 100,
          customResponses: new Map([
            ['test command', ['test response']],
          ]),
        }
      );

      const mockWorker = getMockWorker()!;
      
      // Now disable autoRespond for manual testing
      mockWorker.setAutoRespond(false);
      
      // Test custom response manually
      mockWorker.postMessage('test command');
      
      // Manually trigger the expected response
      mockWorker.triggerResponse('test response');
      
      // Verify the command was queued
      expect(mockWorker.getMessageQueue()).toContain('test command');
      
      cleanup();
    });

    it('should simulate initialization failure deterministically', async () => {
      // Use explicit mock control for deterministic failure
      const { engine, getMockWorker, cleanup } = await createTestEngine(
        {},
        { failOnInit: true }, // Use proper failure mechanism
        { throwOnInitError: false }
      );

      const mockWorker = getMockWorker();
      
      // Verify engine is not ready after failed init
      expect(engine.isReady()).toBe(false);
      
      // Test that engine properly handles the failure state
      const bestMovePromise = engine.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      // Engine should return null immediately for non-ready state
      const result = await bestMovePromise;
      expect(result).toBeNull();
      
      cleanup();
    });
  });

  describe('createRealisticTestEngine', () => {
    it('should create engine with realistic Stockfish responses', async () => {
      const { engine, getMockWorker, cleanup } = await createRealisticTestEngine();
      
      // Engine should already be ready
      expect(engine.isReady()).toBe(true);
      
      // Test getting a best move
      const bestMove = await engine.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(bestMove).toBeDefined();
      expect(bestMove).toHaveProperty('from');
      expect(bestMove).toHaveProperty('to');
      
      cleanup();
    });
  });

  describe('EngineTestScenario', () => {
    it('should simulate best move scenarios', async () => {
      // Use a valid starting position FEN
      const validFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const { engine, getMockWorker, cleanup } = await createTestEngine(
        {},
        { autoRespond: true } // Enable for successful engine operations
      );

      const mockWorker = getMockWorker()!;
      const scenario = new EngineTestScenario(mockWorker);
      
      // Use valid FEN for proper move parsing
      const move = await engine.getBestMove(validFen);
      
      // Verify commands were sent
      expect(scenario.expectCommand('position fen')).toBe(true);
      expect(scenario.expectCommand('go movetime')).toBe(true);
      
      // Move should be parsed successfully with valid FEN
      expect(move).toBeDefined();
      expect(move).toHaveProperty('from');
      expect(move).toHaveProperty('to');
      
      cleanup();
    });

    it('should simulate evaluation scenarios', async () => {
      // Configure custom response for evaluation
      const customResponses = new Map([
        ['go depth', ['info depth 20 score cp 150', 'bestmove e2e4']]
      ]);
      
      const { engine, getMockWorker, cleanup } = await createTestEngine(
        {},
        { 
          autoRespond: true,
          customResponses 
        }
      );

      const mockWorker = getMockWorker()!;
      
      // Start evaluation with valid FEN
      const evaluation = await engine.evaluatePosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(evaluation.score).toBe(150);
      
      cleanup();
    });

    it('should simulate errors', async () => {
      const { engine, getMockWorker, cleanup } = await createTestEngine(
        {},
        { autoRespond: true } // Enable for successful initialization
      );

      const mockWorker = getMockWorker()!;
      
      // Engine is already initialized
      expect(engine.isReady()).toBe(true);
      
      // Turn off auto-respond to manually control error behavior
      mockWorker.setAutoRespond(false);
      
      // Start request with valid FEN
      const movePromise = engine.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      // Simulate error by terminating the worker (no setTimeout needed)
      mockWorker.triggerError('Worker crashed');
      
      // Should handle error gracefully - the promise should reject
      await expect(movePromise).rejects.toThrow('Worker error: Worker crashed');
      
      cleanup();
    });
  });

  describe('Cleanup', () => {
    it('should track and cleanup all engines', async () => {
      const engines = [];
      
      // Create multiple engines
      for (let i = 0; i < 3; i++) {
        engines.push(await createTestEngine());
      }
      
      // All should be tracked
      expect(engines.length).toBe(3);
      
      // Cleanup all
      cleanupAllEngines();
      
      // Create new engine to verify cleanup worked
      const { engine, cleanup } = await createTestEngine();
      expect(engine).toBeDefined();
      cleanup();
    });

    it('should handle cleanup errors gracefully', async () => {
      const { engine, cleanup } = await createTestEngine();
      
      // Mock quit to throw
      engine.quit = jest.fn().mockImplementation(() => {
        throw new Error('Cleanup failed');
      });
      
      // Should not throw
      expect(() => cleanup()).not.toThrow();
      expect(engine.quit).toHaveBeenCalled();
    });
  });

  describe('waitForEngineReady', () => {
    it('should wait for engine to be ready', async () => {
      const { engine, getMockWorker, cleanup } = await createTestEngine();
      
      // Engine is already ready after createTestEngine
      expect(engine.isReady()).toBe(true);
      
      // waitForEngineReady should return true immediately
      const ready = await waitForEngineReady(engine, 2000);
      expect(ready).toBe(true);
      
      cleanup();
    });

    it('should handle graceful degradation when worker unavailable', async () => {
      // Test system behavior when worker is not available (using failOnInit is cleaner)
      const { engine, cleanup } = await createTestEngine(
        {},
        { failOnInit: true }, // Simulate initialization failure 
        { throwOnInitError: false }
      );
      
      // Engine should handle non-ready state gracefully
      expect(engine.isReady()).toBe(false);
      
      // All operations should return safe defaults
      const bestMove = await engine.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(bestMove).toBeNull();
      
      const evaluation = await engine.evaluatePosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(evaluation).toEqual({ score: 0, mate: null });
      
      cleanup();
    });
  });
});