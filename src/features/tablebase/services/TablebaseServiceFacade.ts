/**
 * TablebaseServiceFacade - Strangler Fig Pattern Implementation
 * 
 * @description
 * Provides a feature-flag controlled facade for gradual migration
 * from the legacy TablebaseService to the new implementation.
 * This allows for safe A/B testing and phased rollout.
 */

import type { 
  TablebaseServiceInterface,
  TablebaseEvaluation,
  TablebaseMove
} from '../types/interfaces';
import { TablebaseService } from './TablebaseService';
import FeatureFlagService, { FeatureFlag } from '../../../shared/services/FeatureFlagService';
import { getLogger } from '../../../shared/services/logging/Logger';

const logger = getLogger().setContext('TablebaseServiceFacade');

/**
 * Legacy tablebase service (to be replaced)
 * For now, we'll use the same implementation but in production
 * this would be the old service we're migrating from
 */
class LegacyTablebaseService implements TablebaseServiceInterface {
  evaluate(_fen: string): Promise<TablebaseEvaluation> {
    // In production, this would be the old implementation
    // For now, we'll throw to indicate legacy path
    return Promise.reject(new Error('Legacy tablebase service not implemented'));
  }

  getBestMoves(_fen: string, _limit?: number): Promise<TablebaseMove[]> {
    return Promise.reject(new Error('Legacy tablebase service not implemented'));
  }
}

/**
 * Strangler Facade for Tablebase Service
 * 
 * Routes requests to either legacy or new implementation
 * based on feature flag configuration
 */
export class TablebaseServiceFacade implements TablebaseServiceInterface {
  private readonly legacyService: TablebaseServiceInterface;
  private readonly newService: TablebaseServiceInterface;
  private readonly featureFlagService: FeatureFlagService;

  constructor(
    legacyService?: TablebaseServiceInterface,
    newService?: TablebaseServiceInterface,
    featureFlagService?: FeatureFlagService
  ) {
    this.legacyService = legacyService || new LegacyTablebaseService();
    this.newService = newService || new TablebaseService();
    this.featureFlagService = featureFlagService || FeatureFlagService.getInstance();
  }

  /**
   * Evaluate a position using tablebase
   */
  async evaluate(fen: string): Promise<TablebaseEvaluation> {
    const useNewService = this.shouldUseNewService();
    
    logger.debug('Evaluating position', { 
      fen, 
      service: useNewService ? 'new' : 'legacy' 
    });

    try {
      if (useNewService) {
        return await this.newService.evaluate(fen);
      } else {
        return await this.legacyService.evaluate(fen);
      }
    } catch (error) {
      // Log which service failed for debugging
      logger.error('Evaluation failed', {
        fen,
        service: useNewService ? 'new' : 'legacy',
        error
      });
      throw error;
    }
  }

  /**
   * Get best moves for a position
   */
  async getBestMoves(fen: string, limit?: number): Promise<TablebaseMove[]> {
    const useNewService = this.shouldUseNewService();
    
    logger.debug('Getting best moves', { 
      fen, 
      limit,
      service: useNewService ? 'new' : 'legacy' 
    });

    try {
      if (useNewService) {
        return await this.newService.getBestMoves(fen, limit);
      } else {
        return await this.legacyService.getBestMoves(fen, limit);
      }
    } catch (error) {
      // Log which service failed for debugging
      logger.error('Getting best moves failed', {
        fen,
        limit,
        service: useNewService ? 'new' : 'legacy',
        error
      });
      throw error;
    }
  }

  /**
   * Check if we should use the new service
   * This can be extended to support percentage rollouts
   */
  private shouldUseNewService(): boolean {
    // Check feature flag
    const flagEnabled = this.featureFlagService.isEnabled(
      FeatureFlag.USE_NEW_TABLEBASE_SERVICE
    );

    // Additional logic for percentage rollouts could go here
    // For example:
    // if (flagEnabled && this.isInRolloutPercentage()) { ... }

    return flagEnabled;
  }

  /**
   * Get metrics about service usage (for monitoring)
   */
  getMetrics(): { 
    activeService: 'legacy' | 'new';
    featureFlagEnabled: boolean;
  } {
    const useNewService = this.shouldUseNewService();
    return {
      activeService: useNewService ? 'new' : 'legacy',
      featureFlagEnabled: this.featureFlagService.isEnabled(
        FeatureFlag.USE_NEW_TABLEBASE_SERVICE
      )
    };
  }

  /**
   * Force use of a specific service (for testing)
   */
  forceService(service: 'legacy' | 'new'): void {
    if (service === 'new') {
      this.featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
    } else {
      this.featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, false);
    }
  }
}

// Export singleton instance
export const tablebaseServiceFacade = new TablebaseServiceFacade();

// Export for testing
export { LegacyTablebaseService };