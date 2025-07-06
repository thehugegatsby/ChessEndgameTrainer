/**
 * Discrepancy Monitor for Evaluation System Migration
 * Tracks differences between Legacy and Unified evaluation systems
 */

import { FEATURE_FLAGS } from '../../constants';

// Simple console logger for now
const logger = {
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data),
  info: (message: string, data?: any) => console.info(`[INFO] ${message}`, data),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data)
};

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
  
  private constructor() {}
  
  static getInstance(): DiscrepancyMonitor {
    if (!DiscrepancyMonitor.instance) {
      DiscrepancyMonitor.instance = new DiscrepancyMonitor();
    }
    return DiscrepancyMonitor.instance;
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
    
    // Log based on severity
    const logData = {
      fen: report.fen,
      severity: report.severity,
      discrepancies: report.discrepancies,
      legacy: report.legacyResult,
      unified: report.unifiedResult
    };
    
    switch (report.severity) {
      case 'critical':
        logger.error('Critical evaluation discrepancy', logData);
        break;
      case 'high':
        logger.warn('High evaluation discrepancy', logData);
        break;
      case 'medium':
        logger.info('Medium evaluation discrepancy', logData);
        break;
      case 'low':
        logger.debug('Low evaluation discrepancy', logData);
        break;
    }
    
    // In production, send critical discrepancies to monitoring service
    if (process.env.NODE_ENV === 'production' && report.severity === 'critical') {
      this.sendToMonitoringService(report);
    }
  }
  
  /**
   * Send critical discrepancies to external monitoring
   */
  private async sendToMonitoringService(report: DiscrepancyReport): Promise<void> {
    // TODO: Implement actual monitoring service integration
    // For now, just log
    console.error('[MONITORING] Critical discrepancy detected', {
      fen: report.fen,
      discrepancies: report.discrepancies
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