/**
 * File-based feature flag adapter
 * Reads flag configurations from a JSON file
 */

import { createHash } from 'crypto';
import type { promises as fsType } from 'fs';
import type pathType from 'path';
import { FeatureFlagPort, FeatureFlagContext, FeatureFlagConfig } from '../ports/FeatureFlagPort';

// Import config directly (Next.js will bundle this)
import defaultFlagConfig from '../config/feature-flags.json';

// Dynamic imports for Node.js modules
let fs: typeof fsType;
let path: typeof pathType;

if (typeof window === 'undefined') {
  fs = require('fs').promises;
  path = require('path');
}

export class ConfigFileAdapter implements FeatureFlagPort {
  private flags: Record<string, FeatureFlagConfig>;
  private configPath: string;
  
  constructor() {
    this.flags = defaultFlagConfig as Record<string, FeatureFlagConfig>;
    this.configPath = typeof window === 'undefined' 
      ? path?.join(process.cwd(), 'shared/services/featureFlags/config/feature-flags.json') 
      : '';
  }

  isFeatureEnabled(flagName: string, context: FeatureFlagContext): boolean {
    const config = this.getFlagConfig(flagName);
    
    if (!config || !config.enabled) {
      return false;
    }

    // Check targeting rules first
    if (config.targetingRules && config.targetingRules.length > 0) {
      const matchesTargeting = this.evaluateTargetingRules(config.targetingRules, context);
      if (!matchesTargeting) {
        return false;
      }
    }

    // Check rollout percentage
    if (config.rolloutPercentage !== undefined && config.rolloutPercentage < 100) {
      // For anonymous users without userId, use sessionId if available
      const identifier = context.userId || context.sessionId;
      
      if (!identifier) {
        // No identifier available, default to disabled for safety
        return false;
      }

      return this.isInRollout(identifier, flagName, config.rolloutPercentage);
    }

    return true;
  }

  getFlagConfig(flagName: string): FeatureFlagConfig | null {
    return this.flags[flagName] || null;
  }

  getAllFlags(): string[] {
    return Object.keys(this.flags);
  }

  /**
   * Deterministically check if a user is in the rollout percentage
   */
  private isInRollout(identifier: string, flagName: string, percentage: number): boolean {
    if (percentage === 0) return false;
    if (percentage === 100) return true;

    // For Node.js environment (tests and SSR)
    if (typeof window === 'undefined') {
      const crypto = require('crypto');
      const seed = `${flagName}-${identifier}`;
      const hash = crypto.createHash('sha256').update(seed).digest('hex');
      
      // Convert first 8 chars of hex to number and modulo 100
      const bucket = parseInt(hash.substring(0, 8), 16) % 100;
      
      return bucket < percentage;
    }

    // For browser environment
    const seed = `${flagName}-${identifier}`;
    const hash = createHash('sha256').update(seed).digest('hex');
    
    // Convert first 8 chars of hex to number and modulo 100
    const bucket = parseInt(hash.substring(0, 8), 16) % 100;
    
    return bucket < percentage;
  }

  /**
   * Evaluate targeting rules against context
   */
  private evaluateTargetingRules(rules: any[], context: FeatureFlagContext): boolean {
    return rules.every(rule => {
      const value = this.getContextValue(context, rule.attribute);
      
      switch (rule.operator) {
        case 'equals':
          return value === rule.value;
        case 'contains':
          return String(value).includes(rule.value);
        case 'in':
          return Array.isArray(rule.value) && rule.value.includes(value);
        case 'notIn':
          return Array.isArray(rule.value) && !rule.value.includes(value);
        default:
          return false;
      }
    });
  }

  /**
   * Get value from context by path (supports dot notation)
   */
  private getContextValue(context: FeatureFlagContext, path: string): any {
    const parts = path.split('.');
    let value: any = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  /**
   * Update flag percentage and persist to config file
   * Used by RolloutManager for gradual rollout control
   */
  async updateFlagPercentage(flagName: string, percentage: number): Promise<void> {
    // Validate percentage
    if (percentage < 0 || percentage > 100) {
      throw new Error(`Invalid percentage: ${percentage}. Must be between 0 and 100.`);
    }
    
    // Update in memory
    if (this.flags[flagName]) {
      this.flags[flagName].rolloutPercentage = percentage;
    } else {
      throw new Error(`Flag not found: ${flagName}`);
    }
    
    // Only try to persist if we're in Node.js environment
    if (typeof window === 'undefined' && fs) {
      try {
        // Write to file atomically
        const tempPath = `${this.configPath}.tmp`;
        await fs.writeFile(tempPath, JSON.stringify(this.flags, null, 2), 'utf8');
        await fs.rename(tempPath, this.configPath);
      } catch (error) {
        // If we can't write to file (e.g., read-only filesystem), just log warning
        console.warn(`Could not persist feature flag update for ${flagName}:`, error);
        // Keep the in-memory update
      }
    }
  }
}