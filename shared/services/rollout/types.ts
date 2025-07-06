/**
 * Types for rollout management system
 */

export type RolloutStage = 
  | 'shadow'    // Stage 0: Shadow Mode (0% live, 100% logging)
  | 'canary'    // Stage 1: Initial Canary (1% → 10%)
  | 'expansion' // Stage 2: Expansion (25% → 50%)
  | 'majority'  // Stage 3: Majority (75% → 99%)
  | 'full'      // Stage 4: Full Migration (100%)
  | 'rollback'; // Emergency rollback state

export interface RolloutStageConfig {
  name: RolloutStage;
  displayName: string;
  minPercentage: number;
  maxPercentage: number;
  minDuration: number; // Minimum time in this stage (ms)
  successCriteria: SuccessCriteria;
  alertThresholds: AlertThresholds;
  autoProgress: boolean; // Can auto-progress within stage
  requiresApproval: boolean; // Requires manual approval to enter
}

export interface SuccessCriteria {
  maxCriticalDiscrepancies: number;
  maxHighDiscrepancies: number;
  maxErrorRateDelta: number; // Percentage points above baseline
  maxLatencyDegradation: number; // Percentage above baseline
  minStableDuration: number; // Minimum stable time (ms)
}

export interface AlertThresholds {
  criticalDiscrepancies: number;
  highDiscrepanciesPerHour: number;
  errorRateDelta: number;
  latencyDegradation: number;
}

export interface RolloutState {
  currentStage: RolloutStage;
  currentPercentage: number;
  stageStartTime: number;
  lastHealthCheck: number;
  lastProgression: number;
  isHealthy: boolean;
  isPaused: boolean;
  history: RolloutHistoryEntry[];
}

export interface RolloutHistoryEntry {
  timestamp: number;
  stage: RolloutStage;
  percentage: number;
  action: 'enter' | 'progress' | 'complete' | 'rollback' | 'pause' | 'resume';
  reason?: string;
  metrics?: RolloutMetrics;
}

export interface RolloutMetrics {
  discrepancies: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  performance: {
    canaryLatencyP99: number;
    baselineLatencyP99: number;
    latencyDegradation: number;
  };
  stability: {
    canaryErrorRate: number;
    baselineErrorRate: number;
    errorRateDelta: number;
  };
  volume: {
    totalRequests: number;
    canaryRequests: number;
    baselineRequests: number;
  };
}

export interface HealthCheckResult {
  isHealthy: boolean;
  shouldRollback: boolean;
  alerts: any[]; // Using any[] to avoid circular dependency with AlertManager
  metrics: RolloutMetrics;
  recommendation: 'progress' | 'hold' | 'rollback';
  details: string;
}