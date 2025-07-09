/**
 * @fileoverview E2E Test Bridge Implementation
 * @version 1.0.0
 * @description Implementation of the E2E Test Bridge that provides a clean API
 * for Playwright tests to control the mock engine behavior.
 * 
 * ARCHITECTURE DECISIONS:
 * - Facade pattern over MockEngineService for clean separation
 * - Zero production overhead via dynamic import
 * - Type-safe explicit methods instead of generic configure()
 * - Delegates to MockEngineService methods for encapsulation
 * 
 * IMPORTANT: This file is loaded ONLY in E2E test mode via dynamic import.
 * It will never be included in production bundles.
 */

import type { TestBridge, TestBridgeEngineAPI, TestBridgeDiagnosticAPI } from '../../types/test-bridge';
import type { MockEngineService } from '../engine/MockEngineService';
import type { EngineAnalysis } from '../engine/IEngineService';
import { getLogger } from '../logging';
import type { ILogger } from '../logging/types';

/**
 * Test Bridge Implementation
 * Provides clean API for E2E tests to control mock engine behavior
 */
export class TestBridgeImpl implements TestBridge {
  engine: TestBridgeEngineAPI;
  diagnostic?: TestBridgeDiagnosticAPI;
  private logger: ILogger;

  constructor(private mockEngineService: MockEngineService) {
    this.logger = getLogger().setContext('TestBridge');
    this.engine = this.createEngineAPI();
    // Diagnostic API will be added in Phase 4
    this.logger.info('Test Bridge initialized');
  }

  /**
   * Create the engine control API
   */
  private createEngineAPI(): TestBridgeEngineAPI {
    return {
      setNextMove: (fen: string, move: string) => {
        this.logger.debug(`Setting next move for FEN "${fen}": ${move}`);
        this.mockEngineService.setNextMove(fen, move);
      },

      setEvaluation: (fen: string, evaluation: number) => {
        this.logger.debug(`Setting evaluation for FEN "${fen}": ${evaluation}`);
        this.mockEngineService.setEvaluation(fen, evaluation);
      },

      addCustomResponse: (fen: string, analysis: EngineAnalysis) => {
        this.logger.debug(`Adding custom response for FEN "${fen}"`, { analysis });
        this.mockEngineService.addCustomResponse(fen, analysis);
      },

      clearCustomResponses: () => {
        this.logger.debug('Clearing all custom responses');
        this.mockEngineService.clearCustomResponses();
      },

      reset: () => {
        this.logger.debug('Resetting engine to default state');
        this.mockEngineService.clearCustomResponses();
      },
    };
  }

  /**
   * Wait for engine to be ready
   * Polls the data-engine-status attribute on body
   */
  async waitForReady(timeout: number = 5000): Promise<void> {
    this.logger.debug(`Waiting for engine ready (timeout: ${timeout}ms)`);
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkStatus = () => {
        const status = document.body.getAttribute('data-engine-status');
        
        if (status === 'ready') {
          this.logger.debug('Engine is ready');
          resolve();
        } else if (Date.now() - startTime > timeout) {
          const error = `Engine did not become ready within ${timeout}ms. Current status: ${status}`;
          this.logger.error(error);
          reject(new Error(error));
        } else {
          // Poll every 50ms
          setTimeout(checkStatus, 50);
        }
      };
      
      checkStatus();
    });
  }

  /**
   * Enable debug logging for troubleshooting
   */
  enableDebugLogging(): void {
    this.logger.updateConfig({ minLevel: 0 }); // LogLevel.DEBUG
    this.logger.info('Debug logging enabled');
  }

  /**
   * Disable debug logging
   */
  disableDebugLogging(): void {
    this.logger.info('Debug logging disabled');
    this.logger.updateConfig({ minLevel: 1 }); // LogLevel.INFO
  }
}