/**
 * @fileoverview EvaluationPanel Component Object - Engine evaluation UI abstraction
 * @description Implements engine evaluation display, best move indication, and thinking state management
 * Phase 2.4 Step 1: Initial API design and selector strategy
 */

import { Page, Locator } from '@playwright/test';
import { BaseComponent, BaseComponentConfig } from './BaseComponent';
import { TIMEOUTS, SELECTORS, ERROR_MESSAGES, LOG_CONTEXTS } from '../config/constants';

/**
 * Configuration for EvaluationPanel Component
 */
export interface EvaluationPanelConfig extends BaseComponentConfig {
  /** Timeout for waiting for evaluation updates */
  evaluationTimeout?: number;
  /** Enable evaluation validation */
  enableEvaluationValidation?: boolean;
  /** Polling interval for evaluation changes */
  evaluationPollInterval?: number;
}

/**
 * Engine evaluation information
 */
export interface EngineEvaluation {
  /** Numerical evaluation (centipawns) */
  evaluation: number;
  /** Best move in SAN notation */
  bestMove: string;
  /** Search depth */
  depth: number;
  /** Nodes per second */
  nps?: number;
  /** Time spent thinking (ms) */
  thinkingTime?: number;
  /** Whether evaluation is mate */
  isMate?: boolean;
  /** Mate distance if applicable */
  mateDistance?: number;
}

/**
 * EvaluationPanel Component Object for engine evaluation interactions
 * Implements consensus recommendations from Gemini and O3
 * Focus: Async evaluation handling with robust timeout management
 */
export class EvaluationPanel extends BaseComponent {
  private readonly evaluationTimeout: number;
  private readonly enableEvaluationValidation: boolean;
  private readonly evaluationPollInterval: number;

  constructor(
    page: Page,
    rootSelector?: string,
    config: EvaluationPanelConfig = {}
  ) {
    super(page, rootSelector, config);
    this.evaluationTimeout = config.evaluationTimeout ?? TIMEOUTS.long;
    this.enableEvaluationValidation = config.enableEvaluationValidation ?? true;
    this.evaluationPollInterval = config.evaluationPollInterval ?? TIMEOUTS.poll;
  }

  /**
   * Default selector for evaluation panel container
   * Implements abstract method from BaseComponent
   */
  getDefaultSelector(): string {
    return SELECTORS.EVALUATION_PANEL.PRIMARY;
  }

  /**
   * Get current engine evaluation value
   * Returns evaluation in centipawns (positive = white advantage)
   */
  async getEvaluation(): Promise<number> {
    this.log('info', 'Getting current engine evaluation');
    
    try {
      const evaluationElement = await this.getEvaluationElement();
      const evaluationText = await evaluationElement.textContent();
      
      if (!evaluationText) {
        throw new Error('No evaluation text found');
      }
      
      const evaluation = this.parseEvaluation(evaluationText);
      this.log('info', `Current evaluation: ${evaluation}`, { evaluationText });
      
      return evaluation;
      
    } catch (error) {
      this.log('error', 'Failed to get evaluation', { error: (error as Error).message });
      throw new Error(`Failed to get evaluation: ${(error as Error).message}`);
    }
  }

  /**
   * Get best move suggested by engine
   * Returns move in SAN notation (e.g., 'Nf3', 'O-O')
   */
  async getBestMove(): Promise<string> {
    this.log('info', 'Getting best move from engine');
    
    try {
      const bestMoveElement = await this.getBestMoveElement();
      const bestMoveText = await bestMoveElement.textContent();
      
      if (!bestMoveText) {
        throw new Error('No best move text found');
      }
      
      const bestMove = this.parseBestMove(bestMoveText);
      this.log('info', `Best move: ${bestMove}`, { bestMoveText });
      
      return bestMove;
      
    } catch (error) {
      this.log('error', 'Failed to get best move', { error: (error as Error).message });
      throw new Error(`Failed to get best move: ${(error as Error).message}`);
    }
  }

  /**
   * Get search depth from engine
   * Returns depth as number (e.g., 15 for 15-ply search)
   */
  async getDepth(): Promise<number> {
    this.log('info', 'Getting search depth from engine');
    
    try {
      const depthElement = await this.getDepthElement();
      const depthText = await depthElement.textContent();
      
      if (!depthText) {
        throw new Error('No depth text found');
      }
      
      const depth = this.parseDepth(depthText);
      this.log('info', `Search depth: ${depth}`, { depthText });
      
      return depth;
      
    } catch (error) {
      this.log('error', 'Failed to get depth', { error: (error as Error).message });
      throw new Error(`Failed to get depth: ${(error as Error).message}`);
    }
  }

  /**
   * Wait for evaluation to be available/updated
   * Essential for synchronizing with engine analysis
   */
  async waitForEvaluation(timeout?: number): Promise<void> {
    const timeoutMs = timeout ?? this.evaluationTimeout;
    this.log('info', `Waiting for evaluation (timeout: ${timeoutMs}ms)`);
    
    await this.waitForCondition(async () => {
      try {
        const evaluation = await this.getEvaluation();
        return !isNaN(evaluation);
      } catch {
        return false;
      }
    }, timeoutMs, this.evaluationPollInterval);
    
    this.log('info', 'Evaluation available');
  }

  /**
   * Check if engine is currently thinking/analyzing
   * Returns true if engine is actively calculating
   */
  async isThinking(): Promise<boolean> {
    this.log('info', 'Checking if engine is thinking');
    
    try {
      // Check for thinking indicators
      const thinkingIndicators = await this.getThinkingIndicators();
      
      for (const indicator of thinkingIndicators) {
        const isVisible = await indicator.isVisible();
        if (isVisible) {
          this.log('info', 'Engine is thinking');
          return true;
        }
      }
      
      this.log('info', 'Engine is not thinking');
      return false;
      
    } catch (error) {
      this.log('error', 'Failed to check thinking state', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Get complete evaluation information
   * Returns comprehensive engine analysis data
   */
  async getEvaluationInfo(): Promise<EngineEvaluation> {
    this.log('info', 'Getting complete evaluation information');
    
    try {
      const [evaluation, bestMove, depth] = await Promise.all([
        this.getEvaluation(),
        this.getBestMove(),
        this.getDepth()
      ]);
      
      const evaluationInfo: EngineEvaluation = {
        evaluation,
        bestMove,
        depth
      };
      
      // Try to get additional optional information
      try {
        const nps = await this.getNodesPerSecond();
        if (nps !== null) evaluationInfo.nps = nps;
      } catch {
        // Optional field, ignore errors
      }
      
      this.log('info', 'Complete evaluation info retrieved', { evaluationInfo });
      return evaluationInfo;
      
    } catch (error) {
      this.log('error', 'Failed to get evaluation info', { error: (error as Error).message });
      throw new Error(`Failed to get evaluation info: ${(error as Error).message}`);
    }
  }

  // Private helper methods implementation
  private async getEvaluationElement(): Promise<Locator> {
    const rootElement = await this.getRootElement();
    
    // Try prioritized selectors for evaluation value
    const evaluationSelectors = [
      SELECTORS.EVALUATION_VALUE.PRIMARY,
      SELECTORS.EVALUATION_VALUE.SECONDARY,
      SELECTORS.EVALUATION_VALUE.TERTIARY,
      SELECTORS.EVALUATION_VALUE.FALLBACK
    ];
    
    for (const selector of evaluationSelectors) {
      try {
        const element = rootElement.locator(selector);
        if (await element.count() > 0) {
          this.log('info', `Found evaluation element with selector: ${selector}`);
          return element.first();
        }
      } catch (error) {
        this.log('warn', `Evaluation selector failed: ${selector}`, { error: (error as Error).message });
        continue;
      }
    }
    
    throw new Error('No evaluation element found with any selector');
  }

  private async getBestMoveElement(): Promise<Locator> {
    const rootElement = await this.getRootElement();
    
    // Try prioritized selectors for best move
    const bestMoveSelectors = [
      SELECTORS.BEST_MOVE.PRIMARY,
      SELECTORS.BEST_MOVE.SECONDARY,
      SELECTORS.BEST_MOVE.TERTIARY,
      SELECTORS.BEST_MOVE.FALLBACK
    ];
    
    for (const selector of bestMoveSelectors) {
      try {
        const element = rootElement.locator(selector);
        if (await element.count() > 0) {
          this.log('info', `Found best move element with selector: ${selector}`);
          return element.first();
        }
      } catch (error) {
        this.log('warn', `Best move selector failed: ${selector}`, { error: (error as Error).message });
        continue;
      }
    }
    
    throw new Error('No best move element found with any selector');
  }

  private async getDepthElement(): Promise<Locator> {
    const rootElement = await this.getRootElement();
    
    // Try prioritized selectors for search depth
    const depthSelectors = [
      SELECTORS.SEARCH_DEPTH.PRIMARY,
      SELECTORS.SEARCH_DEPTH.SECONDARY,
      SELECTORS.SEARCH_DEPTH.TERTIARY,
      SELECTORS.SEARCH_DEPTH.FALLBACK
    ];
    
    for (const selector of depthSelectors) {
      try {
        const element = rootElement.locator(selector);
        if (await element.count() > 0) {
          this.log('info', `Found depth element with selector: ${selector}`);
          return element.first();
        }
      } catch (error) {
        this.log('warn', `Depth selector failed: ${selector}`, { error: (error as Error).message });
        continue;
      }
    }
    
    throw new Error('No depth element found with any selector');
  }

  private async getThinkingIndicators(): Promise<Locator[]> {
    const rootElement = await this.getRootElement();
    
    // Try prioritized selectors for thinking indicators
    const thinkingSelectors = [
      SELECTORS.THINKING_INDICATOR.PRIMARY,
      SELECTORS.THINKING_INDICATOR.SECONDARY,
      SELECTORS.THINKING_INDICATOR.TERTIARY,
      SELECTORS.THINKING_INDICATOR.FALLBACK
    ];
    
    const indicators: Locator[] = [];
    
    for (const selector of thinkingSelectors) {
      try {
        const elements = await rootElement.locator(selector).all();
        if (elements.length > 0) {
          this.log('info', `Found ${elements.length} thinking indicators with selector: ${selector}`);
          indicators.push(...elements);
        }
      } catch (error) {
        this.log('warn', `Thinking indicator selector failed: ${selector}`, { error: (error as Error).message });
        continue;
      }
    }
    
    return indicators;
  }

  private parseEvaluation(text: string): number {
    if (!text || text.trim() === '') {
      throw new Error('Empty evaluation text');
    }
    
    const cleanText = text.trim();
    this.log('info', `Parsing evaluation from text: "${cleanText}"`);
    
    // Handle mate indicators
    if (cleanText.toLowerCase().includes('mate') || cleanText.includes('#')) {
      const mateMatch = cleanText.match(/[+-]?(\d+)/);
      if (mateMatch) {
        const mateDistance = parseInt(mateMatch[1], 10);
        // Convert mate distance to large evaluation value
        const mateValue = cleanText.startsWith('-') ? -29999 + mateDistance : 29999 - mateDistance;
        this.log('info', `Parsed mate evaluation: ${mateValue}`, { mateDistance });
        return mateValue;
      }
    }
    
    // Handle centipawn values
    let evaluationValue: number;
    
    // Try to extract numerical value with optional +/- sign
    const numericMatch = cleanText.match(/([+-]?\d+\.?\d*)/);
    if (numericMatch) {
      evaluationValue = parseFloat(numericMatch[1]);
    } else {
      throw new Error(`Unable to parse evaluation from text: "${cleanText}"`);
    }
    
    // Convert to centipawns if needed (some engines show pawns)
    if (Math.abs(evaluationValue) < 50 && !cleanText.includes('cp')) {
      evaluationValue *= 100; // Convert pawns to centipawns
      this.log('info', `Converted pawns to centipawns: ${evaluationValue}`);
    }
    
    this.log('info', `Parsed evaluation: ${evaluationValue}`, { originalText: cleanText });
    return evaluationValue;
  }

  private parseBestMove(text: string): string {
    if (!text || text.trim() === '') {
      throw new Error('Empty best move text');
    }
    
    const cleanText = text.trim();
    this.log('info', `Parsing best move from text: "${cleanText}"`);
    
    // Remove common prefixes/suffixes
    let bestMove = cleanText
      .replace(/^(best move|move):\s*/i, '')
      .replace(/\s*\([^)]*\)$/, '') // Remove parenthetical info
      .trim();
    
    // Validate move format (basic SAN validation)
    if (!bestMove) {
      throw new Error('No valid move found in text');
    }
    
    // Basic SAN validation pattern
    const sanPattern = /^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?$|^O-O(-O)?[+#]?$/;
    if (!sanPattern.test(bestMove)) {
      this.log('warn', `Best move may not be valid SAN: "${bestMove}"`);
    }
    
    this.log('info', `Parsed best move: "${bestMove}"`, { originalText: cleanText });
    return bestMove;
  }

  private parseDepth(text: string): number {
    if (!text || text.trim() === '') {
      throw new Error('Empty depth text');
    }
    
    const cleanText = text.trim();
    this.log('info', `Parsing depth from text: "${cleanText}"`);
    
    // Extract depth number
    const depthMatch = cleanText.match(/(\d+)/);
    if (!depthMatch) {
      throw new Error(`Unable to parse depth from text: "${cleanText}"`);
    }
    
    const depth = parseInt(depthMatch[1], 10);
    if (isNaN(depth) || depth < 0) {
      throw new Error(`Invalid depth value: ${depth}`);
    }
    
    this.log('info', `Parsed depth: ${depth}`, { originalText: cleanText });
    return depth;
  }

  private async getNodesPerSecond(): Promise<number | null> {
    try {
      const rootElement = await this.getRootElement();
      
      // Try to find NPS element
      const npsSelectors = [
        '[data-testid="nps"]',
        '[data-nps]',
        '.nps',
        '.nodes-per-second'
      ];
      
      for (const selector of npsSelectors) {
        try {
          const element = rootElement.locator(selector);
          if (await element.count() > 0) {
            const npsText = await element.textContent();
            if (npsText) {
              const npsMatch = npsText.match(/(\d+(?:\.\d+)?)/);
              if (npsMatch) {
                const nps = parseFloat(npsMatch[1]);
                this.log('info', `Found NPS: ${nps}`, { npsText });
                return nps;
              }
            }
          }
        } catch (error) {
          this.log('warn', `NPS selector failed: ${selector}`, { error: (error as Error).message });
          continue;
        }
      }
      
      return null; // NPS is optional
      
    } catch (error) {
      this.log('warn', 'Failed to get NPS', { error: (error as Error).message });
      return null;
    }
  }
}