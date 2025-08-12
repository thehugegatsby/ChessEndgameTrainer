/**
 * Feature Flag Service for Strangler Fig Pattern Migration
 * 
 * This service manages feature flags for A/B testing between legacy and new implementations
 * during the gradual migration process.
 */

export enum FeatureFlag {
  // Chess Core Features
  USE_NEW_CHESS_CORE = 'use_new_chess_core',
  USE_NEW_MOVE_VALIDATION = 'use_new_move_validation',
  
  // Tablebase Features
  USE_NEW_TABLEBASE_SERVICE = 'use_new_tablebase_service',
  USE_NEW_TABLEBASE_UI = 'use_new_tablebase_ui',
  
  // Training Features
  USE_NEW_TRAINING_LOGIC = 'use_new_training_logic',
  USE_NEW_TRAINING_BOARD = 'use_new_training_board',
  
  // Move Quality Features
  USE_NEW_MOVE_QUALITY = 'use_new_move_quality',
  
  // Progress Features
  USE_NEW_PROGRESS_TRACKING = 'use_new_progress_tracking',
  
  // UI Components
  USE_NEW_COMPONENT_LIBRARY = 'use_new_component_library',
  
  // Event System
  USE_EVENT_DRIVEN_TRAINING = 'use_event_driven_training',
}

interface FeatureFlagConfig {
  [key: string]: boolean | string | number;
}

class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: FeatureFlagConfig = {};
  private overrides: Map<string, boolean> = new Map();

  private constructor() {
    this.loadFlags();
  }

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Load feature flags from environment or localStorage
   */
  private loadFlags(): void {
    // Load from environment variables (for server-side)
    if (typeof process !== 'undefined' && process.env) {
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('NEXT_PUBLIC_FF_')) {
          const flagName = key.replace('NEXT_PUBLIC_FF_', '').toLowerCase();
          this.flags[flagName] = process.env[key] === 'true';
        }
      });
    }

    // Load from localStorage (for client-side persistence and testing)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('featureFlags');
        if (stored) {
          const parsed = JSON.parse(stored);
          this.flags = { ...this.flags, ...parsed };
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to load feature flags from localStorage:', error);
        }
      }
    }

    // Development defaults - gradually enable new features
    if (process.env.NODE_ENV === 'development') {
      this.applyDevelopmentDefaults();
    }
  }

  /**
   * Apply development defaults for testing new features
   */
  private applyDevelopmentDefaults(): void {
    const devDefaults: FeatureFlagConfig = {
      // Start with all features disabled, enable as they're implemented
      [FeatureFlag.USE_NEW_CHESS_CORE]: false,
      [FeatureFlag.USE_NEW_MOVE_VALIDATION]: false,
      [FeatureFlag.USE_NEW_TABLEBASE_SERVICE]: false,
      [FeatureFlag.USE_NEW_TABLEBASE_UI]: false,
      [FeatureFlag.USE_NEW_TRAINING_LOGIC]: false,
      [FeatureFlag.USE_NEW_TRAINING_BOARD]: false,
      [FeatureFlag.USE_NEW_MOVE_QUALITY]: false,
      [FeatureFlag.USE_NEW_PROGRESS_TRACKING]: false,
      [FeatureFlag.USE_NEW_COMPONENT_LIBRARY]: false,
    };

    // Only apply defaults for flags that aren't already set
    Object.entries(devDefaults).forEach(([key, value]) => {
      if (!(key in this.flags)) {
        this.flags[key] = value;
      }
    });
  }

  /**
   * Check if a feature flag is enabled
   */
  public isEnabled(flag: FeatureFlag): boolean {
    // Check for runtime overrides first
    if (this.overrides.has(flag)) {
      return this.overrides.get(flag) ?? false;
    }

    // Check configured flags
    const value = this.flags[flag];
    if (typeof value === 'boolean') {
      return value;
    }
    
    // Default to false (legacy behavior) if not configured
    return false;
  }

  /**
   * Check if a feature flag is disabled (convenience method)
   */
  public isDisabled(flag: FeatureFlag): boolean {
    return !this.isEnabled(flag);
  }

  /**
   * Override a feature flag at runtime (useful for testing)
   */
  public override(flag: FeatureFlag, enabled: boolean): void {
    this.overrides.set(flag, enabled);
    
    // Update internal state to maintain consistency
    this.flags[flag] = enabled;
    
    // Persist to localStorage for client-side
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('featureFlags', JSON.stringify(this.flags));
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to persist feature flag override:', error);
        }
      }
    }

    // Dispatch custom event for React components to re-render
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('featureFlagChanged', { 
        detail: { flag, enabled } 
      }));
    }
  }

  /**
   * Clear all runtime overrides
   */
  public clearOverrides(): void {
    this.overrides.clear();
    
    // Reset flags to original state (reload from environment)
    this.flags = {};
    this.loadFlags();
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('featureFlags');
    }
  }

  /**
   * Get all current feature flags and their states (for debugging)
   */
  public getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    
    Object.values(FeatureFlag).forEach(flag => {
      result[flag] = this.isEnabled(flag);
    });
    
    return result;
  }

  /**
   * Enable a specific migration phase (convenience method)
   */
  public enablePhase(phase: 'chess' | 'tablebase' | 'training' | 'move-quality' | 'progress'): void {
    switch (phase) {
      case 'chess':
        this.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
        this.override(FeatureFlag.USE_NEW_MOVE_VALIDATION, true);
        break;
      case 'tablebase':
        this.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
        this.override(FeatureFlag.USE_NEW_TABLEBASE_UI, true);
        break;
      case 'training':
        this.override(FeatureFlag.USE_NEW_TRAINING_LOGIC, true);
        this.override(FeatureFlag.USE_NEW_TRAINING_BOARD, true);
        break;
      case 'move-quality':
        this.override(FeatureFlag.USE_NEW_MOVE_QUALITY, true);
        break;
      case 'progress':
        this.override(FeatureFlag.USE_NEW_PROGRESS_TRACKING, true);
        break;
    }
  }

  /**
   * Disable a specific migration phase (rollback)
   */
  public disablePhase(phase: 'chess' | 'tablebase' | 'training' | 'move-quality' | 'progress'): void {
    switch (phase) {
      case 'chess':
        this.override(FeatureFlag.USE_NEW_CHESS_CORE, false);
        this.override(FeatureFlag.USE_NEW_MOVE_VALIDATION, false);
        break;
      case 'tablebase':
        this.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, false);
        this.override(FeatureFlag.USE_NEW_TABLEBASE_UI, false);
        break;
      case 'training':
        this.override(FeatureFlag.USE_NEW_TRAINING_LOGIC, false);
        this.override(FeatureFlag.USE_NEW_TRAINING_BOARD, false);
        break;
      case 'move-quality':
        this.override(FeatureFlag.USE_NEW_MOVE_QUALITY, false);
        break;
      case 'progress':
        this.override(FeatureFlag.USE_NEW_PROGRESS_TRACKING, false);
        break;
    }
  }
}

// Export singleton instance
export const featureFlags = FeatureFlagService.getInstance();

// Export for testing
export default FeatureFlagService;