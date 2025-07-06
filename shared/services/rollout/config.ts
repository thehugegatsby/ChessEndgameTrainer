/**
 * Rollout stage configurations
 */

import { RolloutStageConfig } from './types';

export const ROLLOUT_STAGES: Record<string, RolloutStageConfig> = {
  shadow: {
    name: 'shadow',
    displayName: 'Shadow Mode',
    minPercentage: 0,
    maxPercentage: 0,
    minDuration: 2 * 24 * 60 * 60 * 1000, // 2 days
    successCriteria: {
      maxCriticalDiscrepancies: 0,
      maxHighDiscrepancies: 10,
      maxErrorRateDelta: 0.01, // 0.01%
      maxLatencyDegradation: 10, // 10%
      minStableDuration: 4 * 60 * 60 * 1000, // 4 hours
    },
    alertThresholds: {
      criticalDiscrepancies: 1,
      highDiscrepanciesPerHour: 5,
      errorRateDelta: 0.1, // 0.1%
      latencyDegradation: 15, // 15%
    },
    autoProgress: false,
    requiresApproval: false,
  },
  
  canary: {
    name: 'canary',
    displayName: 'Initial Canary',
    minPercentage: 1,
    maxPercentage: 10,
    minDuration: 24 * 60 * 60 * 1000, // 1 day
    successCriteria: {
      maxCriticalDiscrepancies: 0,
      maxHighDiscrepancies: 5,
      maxErrorRateDelta: 0.1, // 0.1%
      maxLatencyDegradation: 15, // 15%
      minStableDuration: 4 * 60 * 60 * 1000, // 4 hours
    },
    alertThresholds: {
      criticalDiscrepancies: 1,
      highDiscrepanciesPerHour: 5,
      errorRateDelta: 1.0, // 1%
      latencyDegradation: 20, // 20%
    },
    autoProgress: true, // Can auto-progress from 1% to 10%
    requiresApproval: true, // Requires approval to enter
  },
  
  expansion: {
    name: 'expansion',
    displayName: 'Expansion Phase',
    minPercentage: 25,
    maxPercentage: 50,
    minDuration: 3 * 24 * 60 * 60 * 1000, // 3 days
    successCriteria: {
      maxCriticalDiscrepancies: 0,
      maxHighDiscrepancies: 10,
      maxErrorRateDelta: 0.5, // 0.5%
      maxLatencyDegradation: 20, // 20%
      minStableDuration: 8 * 60 * 60 * 1000, // 8 hours
    },
    alertThresholds: {
      criticalDiscrepancies: 1,
      highDiscrepanciesPerHour: 10,
      errorRateDelta: 0.5, // 0.5%
      latencyDegradation: 25, // 25%
    },
    autoProgress: true,
    requiresApproval: true,
  },
  
  majority: {
    name: 'majority',
    displayName: 'Majority Rollout',
    minPercentage: 75,
    maxPercentage: 99,
    minDuration: 7 * 24 * 60 * 60 * 1000, // 1 week
    successCriteria: {
      maxCriticalDiscrepancies: 0,
      maxHighDiscrepancies: 20,
      maxErrorRateDelta: 1.0, // 1%
      maxLatencyDegradation: 25, // 25%
      minStableDuration: 12 * 60 * 60 * 1000, // 12 hours
    },
    alertThresholds: {
      criticalDiscrepancies: 1,
      highDiscrepanciesPerHour: 20,
      errorRateDelta: 1.0, // 1%
      latencyDegradation: 30, // 30%
    },
    autoProgress: false, // Manual progression only at this stage
    requiresApproval: true,
  },
  
  full: {
    name: 'full',
    displayName: 'Full Migration',
    minPercentage: 100,
    maxPercentage: 100,
    minDuration: 7 * 24 * 60 * 60 * 1000, // 1 week before decommission
    successCriteria: {
      maxCriticalDiscrepancies: 0,
      maxHighDiscrepancies: 50,
      maxErrorRateDelta: 2.0, // 2%
      maxLatencyDegradation: 30, // 30%
      minStableDuration: 24 * 60 * 60 * 1000, // 24 hours
    },
    alertThresholds: {
      criticalDiscrepancies: 1,
      highDiscrepanciesPerHour: 50,
      errorRateDelta: 2.0, // 2%
      latencyDegradation: 35, // 35%
    },
    autoProgress: false,
    requiresApproval: true,
  },
  
  rollback: {
    name: 'rollback',
    displayName: 'Emergency Rollback',
    minPercentage: 0,
    maxPercentage: 0,
    minDuration: 0,
    successCriteria: {
      maxCriticalDiscrepancies: 0,
      maxHighDiscrepancies: 0,
      maxErrorRateDelta: 0,
      maxLatencyDegradation: 0,
      minStableDuration: 0,
    },
    alertThresholds: {
      criticalDiscrepancies: 0,
      highDiscrepanciesPerHour: 0,
      errorRateDelta: 0,
      latencyDegradation: 0,
    },
    autoProgress: false,
    requiresApproval: false,
  },
};

// Stage progression order
export const STAGE_ORDER: string[] = ['shadow', 'canary', 'expansion', 'majority', 'full'];

// Default rollout configuration
export const ROLLOUT_CONFIG = {
  healthCheckInterval: 60 * 1000, // 1 minute
  progressionCheckInterval: 5 * 60 * 1000, // 5 minutes
  metricsWindow: 15 * 60 * 1000, // 15 minutes for metric calculations
  maxRollbackAttempts: 3,
  rollbackCooldown: 60 * 60 * 1000, // 1 hour
};