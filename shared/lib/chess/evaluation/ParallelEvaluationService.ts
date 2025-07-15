/**
 * ParallelEvaluationService - Optimized chess position evaluation
 * 
 * Combines engine and tablebase evaluations using parallel execution
 * with intelligent fallbacks and racing strategies for optimal performance.
 */

import { EvaluationDeduplicator } from './EvaluationDeduplicator';
import { ChessAwareCache } from './ChessAwareCache';
import { getLogger } from '@shared/services/logging';
import { CACHE, ANIMATION } from '@shared/constants';

interface EngineEvaluation {
  score: number;
  mate?: number | null;
  depth?: number;
  bestMove?: string;
  pv?: string[];
}

interface TablebaseEvaluation {
  isTablebasePosition: boolean;
  wdl?: number;
  dtm?: number;
  category?: string;
  precise?: boolean;
}

interface DualEvaluation {
  engine: EngineEvaluation;
  tablebase?: TablebaseEvaluation;
  source: 'engine' | 'tablebase' | 'hybrid';
  evaluationTime: number;
  fromCache: boolean;
}

interface EvaluationOptions {
  timeout?: number;           // Max time to wait for evaluation
  tablebaseTimeout?: number;  // Max time to wait for tablebase specifically
  priority?: 'low' | 'normal' | 'high';
  preferTablebase?: boolean;  // Prefer tablebase over engine when available
}

type SimpleEngineService = {
  evaluatePosition: (fen: string, options?: any) => Promise<EngineEvaluation>;
  cancelEvaluation?: (fen: string) => void;
};

type TablebaseService = {
  getTablebaseInfo: (fen: string) => Promise<TablebaseEvaluation>;
};

export class ParallelEvaluationService {
  private deduplicator = new EvaluationDeduplicator();
  private cache = new ChessAwareCache<DualEvaluation>(CACHE.PARALLEL_EVALUATION_CACHE_SIZE);
  
  private engineService: SimpleEngineService;
  private tablebaseService: TablebaseService;
  
  // Performance tracking
  private stats = {
    totalEvaluations: 0,
    cacheHits: 0,
    engineWins: 0,
    tablebaseWins: 0,
    hybridResults: 0,
    averageTime: 0
  };

  constructor(engineService: SimpleEngineService, tablebaseService: TablebaseService) {
    this.engineService = engineService;
    this.tablebaseService = tablebaseService;
  }

  /**
   * Evaluate a chess position using parallel engine and tablebase lookup
   */
  async evaluatePosition(fen: string, options: EvaluationOptions = {}): Promise<DualEvaluation> {
    const startTime = performance.now();
    
    // Check cache first
    const cached = this.cache.get(fen);
    if (cached) {
      this.stats.cacheHits++;
      return {
        ...cached,
        fromCache: true,
        evaluationTime: performance.now() - startTime
      };
    }

    // Use deduplicator to prevent redundant evaluations
    return this.deduplicator.evaluate(fen, async (position) => {
      const result = await this.performParallelEvaluation(position, options, startTime);
      
      // Cache the result
      this.cache.set(position, result);
      
      // Update statistics
      this.updateStats(result, performance.now() - startTime);
      
      return result;
    });
  }

  /**
   * Perform the actual parallel evaluation
   */
  private async performParallelEvaluation(
    fen: string, 
    options: EvaluationOptions,
    startTime: number
  ): Promise<DualEvaluation> {
    const {
      timeout = 5000,
      tablebaseTimeout = 50,
      preferTablebase = true
    } = options;

    // Start both evaluations in parallel
    const enginePromise = this.engineService.evaluatePosition(fen, options)
      .catch(error => {
        const logger = getLogger();
        logger.warn('[ParallelEvaluationService] Engine evaluation failed:', error);
        return this.createFallbackEngineEvaluation();
      });

    const tablebasePromise = this.tablebaseService.getTablebaseInfo(fen)
      .catch(() => null); // Silent fail for tablebase

    try {
      // Strategy 1: Quick tablebase check with timeout
      const quickTablebaseResult = await Promise.race([
        tablebasePromise,
        new Promise<null>(resolve => setTimeout(() => resolve(null), tablebaseTimeout))
      ]);

      // If tablebase found definitive result quickly, prioritize it
      if (quickTablebaseResult?.isTablebasePosition && preferTablebase) {
        // Cancel engine evaluation if possible to save resources
        if (this.engineService.cancelEvaluation) {
          this.engineService.cancelEvaluation(fen);
        }

        const engineFallback = this.createEngineFromTablebase(quickTablebaseResult);
        
        return {
          engine: engineFallback,
          tablebase: quickTablebaseResult,
          source: 'tablebase',
          evaluationTime: performance.now() - startTime,
          fromCache: false
        };
      }

      // Strategy 2: Race or wait for both with overall timeout
      const racePromise = Promise.race([
        enginePromise.then(engine => ({ engine, source: 'engine' as const })),
        tablebasePromise.then(tablebase => ({ tablebase, source: 'tablebase' as const }))
      ]);

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Evaluation timeout')), timeout)
      );

      const firstResult = await Promise.race([racePromise, timeoutPromise]);

      // Get the remaining result with a shorter timeout
      let finalResult: DualEvaluation;
      
      if (firstResult.source === 'engine') {
        const remainingTablebase = await Promise.race([
          tablebasePromise,
          new Promise<null>(resolve => setTimeout(() => resolve(null), ANIMATION.PARALLEL_EVALUATION_DELAY))
        ]);

        finalResult = {
          engine: firstResult.engine!,
          tablebase: remainingTablebase || undefined,
          source: remainingTablebase?.isTablebasePosition ? 'hybrid' : 'engine',
          evaluationTime: performance.now() - startTime,
          fromCache: false
        };
      } else {
        const remainingEngine = await Promise.race([
          enginePromise,
          new Promise<EngineEvaluation>(resolve => 
            setTimeout(() => resolve(this.createFallbackEngineEvaluation()), ANIMATION.PARALLEL_EVALUATION_FALLBACK)
          )
        ]);

        finalResult = {
          engine: remainingEngine,
          tablebase: firstResult.tablebase || undefined,
          source: firstResult.tablebase?.isTablebasePosition ? 'hybrid' : 'engine',
          evaluationTime: performance.now() - startTime,
          fromCache: false
        };
      }

      return finalResult;

    } catch (error) {
      const logger = getLogger();
      logger.warn('[ParallelEvaluationService] Evaluation failed:', error);
      
      // Fallback to basic engine evaluation
      try {
        const fallbackEngine = await enginePromise;
        return {
          engine: fallbackEngine,
          source: 'engine',
          evaluationTime: performance.now() - startTime,
          fromCache: false
        };
      } catch {
        return {
          engine: this.createFallbackEngineEvaluation(),
          source: 'engine',
          evaluationTime: performance.now() - startTime,
          fromCache: false
        };
      }
    }
  }

  /**
   * Create fallback engine evaluation when engine fails
   */
  private createFallbackEngineEvaluation(): EngineEvaluation {
    return {
      score: 0,
      mate: null,
      depth: 0,
      bestMove: undefined,
      pv: []
    };
  }

  /**
   * Create engine evaluation from tablebase result
   */
  private createEngineFromTablebase(tablebase: TablebaseEvaluation): EngineEvaluation {
    let score = 0;
    let mate: number | null = null;

    if (tablebase.wdl !== undefined) {
      if (tablebase.wdl > 0) {
        // Winning position
        score = 1000;
        if (tablebase.dtm) {
          mate = Math.ceil(tablebase.dtm / 2); // Convert plies to moves
        }
      } else if (tablebase.wdl < 0) {
        // Losing position
        score = -1000;
        if (tablebase.dtm) {
          mate = -Math.ceil(Math.abs(tablebase.dtm) / 2);
        }
      }
      // Draw positions keep score = 0
    }

    return {
      score,
      mate,
      depth: 32, // Max depth for tablebase
      bestMove: undefined,
      pv: []
    };
  }

  /**
   * Update performance statistics
   */
  private updateStats(result: DualEvaluation, evaluationTime: number): void {
    this.stats.totalEvaluations++;
    
    // Update average time using running average
    this.stats.averageTime = (
      (this.stats.averageTime * (this.stats.totalEvaluations - 1) + evaluationTime) / 
      this.stats.totalEvaluations
    );

    // Count result sources
    switch (result.source) {
      case 'engine':
        this.stats.engineWins++;
        break;
      case 'tablebase':
        this.stats.tablebaseWins++;
        break;
      case 'hybrid':
        this.stats.hybridResults++;
        break;
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats();
    const deduplicationStats = this.deduplicator.getStats();
    
    return {
      evaluations: {
        total: this.stats.totalEvaluations,
        averageTime: Math.round(this.stats.averageTime * 100) / 100,
        cacheHitRate: this.stats.totalEvaluations > 0 
          ? Math.round((this.stats.cacheHits / this.stats.totalEvaluations) * 100) / 100
          : 0
      },
      sources: {
        engine: this.stats.engineWins,
        tablebase: this.stats.tablebaseWins,
        hybrid: this.stats.hybridResults
      },
      cache: cacheStats,
      deduplication: deduplicationStats
    };
  }

  /**
   * Clear all caches and reset statistics
   */
  reset(): void {
    this.cache.clear();
    this.deduplicator.clear();
    this.stats = {
      totalEvaluations: 0,
      cacheHits: 0,
      engineWins: 0,
      tablebaseWins: 0,
      hybridResults: 0,
      averageTime: 0
    };
  }
}