/**
 * Discrepancy Monitor for Evaluation System Migration
 * Tracks differences between Legacy and Unified evaluation systems
 */

import { FEATURE_FLAGS } from '../../constants';
import { MonitoringPort } from './ports/MonitoringPort';
import { ConsoleAdapter } from './adapters/ConsoleAdapter';

export interface EvaluationResult {
  score?: number;
  mate?: number | null;
  bestMove?: string;
  depth?: number;
  isTablebase?: boolean;
  wdl?: number;
  dtm?: number;
  dtz?: number;
}

export interface DiscrepancyReport {
  fen: string;
  timestamp: string;
  legacyResult: EvaluationResult;
  unifiedResult: EvaluationResult;
  discrepancies: {
    scoreDiff?: number;
    mateDiff?: boolean;
    bestMoveDiff?: boolean;
    wdlDiff?: boolean;
    dtmDiff?: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class DiscrepancyMonitor {
  private static instance: DiscrepancyMonitor;
  private discrepancies: DiscrepancyReport[] = [];
  private readonly maxDiscrepancies = 1000;
  private monitoring: MonitoringPort;
  
  private constructor(monitoring?: MonitoringPort) {
    // Use provided monitoring adapter or default to console
    this.monitoring = monitoring || new ConsoleAdapter(
      process.env.NODE_ENV === 'development' || 
      FEATURE_FLAGS.LOG_EVALUATION_DISCREPANCIES
    );
  }
  
  static getInstance(monitoring?: MonitoringPort): DiscrepancyMonitor {
    if (!DiscrepancyMonitor.instance) {
      DiscrepancyMonitor.instance = new DiscrepancyMonitor(monitoring);
    }
    return DiscrepancyMonitor.instance;
  }
  
  /**
   * Set a new monitoring adapter
   */
  setMonitoringAdapter(monitoring: MonitoringPort): void {
    this.monitoring = monitoring;
  }
  
  /**
   * Compare evaluation results from both systems
   */
  compareResults(
    fen: string,
    legacyResult: EvaluationResult,
    unifiedResult: EvaluationResult
  ): DiscrepancyReport | null {
    if (!FEATURE_FLAGS.LOG_EVALUATION_DISCREPANCIES) {
      return null;
    }
    
    const discrepancies = this.findDiscrepancies(legacyResult, unifiedResult);
    
    // Only log if there are meaningful discrepancies
    if (Object.keys(discrepancies).length === 0) {
      return null;
    }
    
    const severity = this.calculateSeverity(discrepancies);
    
    const report: DiscrepancyReport = {
      fen,
      timestamp: new Date().toISOString(),
      legacyResult,
      unifiedResult,
      discrepancies,
      severity
    };
    
    this.logDiscrepancy(report);
    return report;
  }
  
  /**
   * Find differences between evaluation results
   */
  private findDiscrepancies(
    legacy: EvaluationResult,
    unified: EvaluationResult
  ): DiscrepancyReport['discrepancies'] {
    const discrepancies: DiscrepancyReport['discrepancies'] = {};
    
    // Score difference (ignore small differences < 10 centipawns)
    if (legacy.score !== undefined && unified.score !== undefined) {
      const diff = Math.abs(legacy.score - unified.score);
      if (diff >= 10) {
        discrepancies.scoreDiff = diff;
      }
    }
    
    // Mate evaluation difference
    if (legacy.mate !== unified.mate) {
      discrepancies.mateDiff = true;
    }
    
    // Best move difference (only for significant evaluations)
    if (legacy.bestMove && unified.bestMove && legacy.bestMove !== unified.bestMove) {
      // Only flag if evaluation difference is significant
      if (discrepancies.scoreDiff && discrepancies.scoreDiff > 50) {
        discrepancies.bestMoveDiff = true;
      }
    }
    
    // Tablebase differences
    if (legacy.wdl !== undefined && unified.wdl !== undefined && legacy.wdl !== unified.wdl) {
      discrepancies.wdlDiff = true;
    }
    
    if (legacy.dtm !== undefined && unified.dtm !== undefined) {
      const dtmDiff = Math.abs(legacy.dtm - unified.dtm);
      if (dtmDiff > 0) {
        discrepancies.dtmDiff = dtmDiff;
      }
    }
    
    return discrepancies;
  }
  
  /**
   * Calculate severity of discrepancies
   */
  private calculateSeverity(
    discrepancies: DiscrepancyReport['discrepancies']
  ): DiscrepancyReport['severity'] {
    // Critical: Different mate evaluations or WDL
    if (discrepancies.mateDiff || discrepancies.wdlDiff) {
      return 'critical';
    }
    
    // High: Large score differences or different best moves
    if ((discrepancies.scoreDiff && discrepancies.scoreDiff > 200) || 
        discrepancies.bestMoveDiff) {
      return 'high';
    }
    
    // Medium: Moderate score differences
    if (discrepancies.scoreDiff && discrepancies.scoreDiff > 50) {
      return 'medium';
    }
    
    // Low: Small differences
    return 'low';
  }
  
  /**
   * Log discrepancy for analysis
   */
  private logDiscrepancy(report: DiscrepancyReport): void {
    // Add to memory store
    this.discrepancies.push(report);
    
    // Limit memory usage
    if (this.discrepancies.length > this.maxDiscrepancies) {
      this.discrepancies.shift();
    }
    
    // Determine discrepancy type
    const discrepancyType = this.determineDiscrepancyType(report.discrepancies);
    
    // Use monitoring port to capture discrepancy
    this.monitoring.captureDiscrepancy({
      severity: report.severity,
      type: discrepancyType,
      context: {
        fen: report.fen,
        discrepancies: report.discrepancies,
        legacy: report.legacyResult,
        unified: report.unifiedResult,
        timestamp: report.timestamp
      }
    });
    
    // Increment counters for metrics
    this.monitoring.incrementCounter('evaluation.discrepancy.total', {
      severity: report.severity,
      type: discrepancyType
    });
    
    // In production, send critical discrepancies to monitoring service
    if (process.env.NODE_ENV === 'production' && report.severity === 'critical') {
      this.sendToMonitoringService(report);
    }
  }
  
  /**
   * Determine the primary type of discrepancy
   */
  private determineDiscrepancyType(discrepancies: DiscrepancyReport['discrepancies']): string {
    if (discrepancies.mateDiff) return 'mate_difference';
    if (discrepancies.wdlDiff) return 'wdl_mismatch';
    if (discrepancies.bestMoveDiff) return 'best_move_difference';
    if (discrepancies.scoreDiff) return 'score_mismatch';
    if (discrepancies.dtmDiff) return 'dtm_difference';
    return 'unknown';
  }
  
  /**
   * Send critical discrepancies to external monitoring
   */
  private async sendToMonitoringService(report: DiscrepancyReport): Promise<void> {
    // Record as critical error
    this.monitoring.recordError({
      message: `Critical evaluation discrepancy: ${this.determineDiscrepancyType(report.discrepancies)}`,
      severity: 'critical',
      context: {
        fen: report.fen,
        discrepancies: report.discrepancies,
        legacyResult: report.legacyResult,
        unifiedResult: report.unifiedResult
      }
    });
  }
  
  /**
   * Get discrepancy statistics
   */
  getStatistics(): {
    total: number;
    bySeverity: Record<DiscrepancyReport['severity'], number>;
    recentDiscrepancies: DiscrepancyReport[];
  } {
    const bySeverity = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    this.discrepancies.forEach(d => {
      bySeverity[d.severity]++;
    });
    
    return {
      total: this.discrepancies.length,
      bySeverity,
      recentDiscrepancies: this.discrepancies.slice(-10)
    };
  }
  
  /**
   * Clear all discrepancy records
   */
  clear(): void {
    this.discrepancies = [];
  }
  
  /**
   * Export discrepancies for analysis
   */
  exportDiscrepancies(): DiscrepancyReport[] {
    return [...this.discrepancies];
  }
}