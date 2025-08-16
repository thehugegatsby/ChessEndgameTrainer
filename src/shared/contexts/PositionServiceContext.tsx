'use client';

/**
 * Position Service Context
 * Provides dependency injection for PositionService throughout the React app
 */

import React, { createContext, useContext, useMemo } from 'react';
import { PositionService as DefaultPositionService } from '@shared/services/database/PositionService';
import {
  type PositionService,
  type PositionServiceConfig,
} from '@shared/services/database/IPositionService';
import { type PositionRepository } from '@shared/repositories/IPositionRepository';
import { FirebasePositionRepository } from '@shared/repositories/implementations/FirebasePositionRepository';
import { MockPositionRepository } from '@shared/repositories/implementations/MockPositionRepository';
import { db } from '@shared/lib/firebase';
import {
  shouldUseMockService,
  createMockPositionRepository,
} from '@shared/testing/MockPositionServiceFactory';
import { CACHE } from '@shared/constants';
import { getLogger } from '@shared/services/logging';

const logger = getLogger().setContext('PositionServiceContext');

/**
 * Context value type
 */
interface PositionServiceContextValue {
  positionService: PositionService;
  repository: PositionRepository;
}

/**
 * React Context
 */
const PositionServiceContext = createContext<PositionServiceContextValue | undefined>(undefined);

/**
 * Provider props
 */
interface PositionServiceProviderProps {
  children: React.ReactNode;
  /**
   * Override the default repository (useful for testing)
   */
  repository?: PositionRepository;
  /**
   * Service configuration
   */
  config?: PositionServiceConfig;
}

/**
 * Position Service Provider
 * Instantiates and provides the PositionService with proper repository
 * @param root0
 * @param root0.children
 * @param root0.repository
 * @param root0.config
 */
export /**
 *
 */
const PositionServiceProvider: React.FC<PositionServiceProviderProps> = ({
  children,
  repository,
  config,
}) => {
  const value = useMemo(() => {
    // Use provided repository or create default based on environment
    const repo = repository || createDefaultRepository();

    // Create service with repository
    const service = new DefaultPositionService(repo, config);

    return {
      positionService: service,
      repository: repo,
    };
  }, [repository, config]);

  return (
    <PositionServiceContext.Provider value={value}>{children}</PositionServiceContext.Provider>
  );
};

/**
 * Hook to access PositionService
 * Returns null during SSR/build to prevent pre-rendering errors
 */
export /**
 *
 */
const usePositionService = (): PositionService | null => {
  const context = useContext(PositionServiceContext);

  if (!context) {
    // Return null instead of throwing to make it SSR-safe
    return null;
  }

  return context.positionService;
};

/**
 * Hook to access the repository directly (mainly for testing)
 */
export /**
 *
 */
const usePositionRepository = (): PositionRepository => {
  const context = useContext(PositionServiceContext);

  if (!context) {
    throw new Error('usePositionRepository must be used within PositionServiceProvider');
  }

  return context.repository;
};

/**
 * Create default repository based on environment
 */
function createDefaultRepository(): PositionRepository {
  // Use pre-seeded mock repository for E2E tests (bypasses Firebase completely)
  if (shouldUseMockService()) {
    logger.info('Using MockPositionRepository with pre-seeded test data for E2E testing');
    return createMockPositionRepository();
  }

  // Use mock repository in unit test environment
  if (process.env.NODE_ENV === 'test' && !process.env['USE_REAL_FIREBASE']) {
    logger.info('Using MockPositionRepository for unit testing');
    return new MockPositionRepository({
      enableCache: true,
      events: {
        /**
         *
         * @param operation
         * @param count
         */
        onDataFetched: (operation, count) => {
          logger.debug(`Mock: ${operation} fetched ${count} items`);
        },
      },
    });
  }

  // Use Firebase repository in production/development
  logger.info('Using FirebasePositionRepository');
  return new FirebasePositionRepository(db, {
    enableCache: true,
    cacheSize: CACHE.POSITION_CACHE_SIZE,
    cacheTTL: CACHE.ANALYSIS_CACHE_TTL,
    events: {
      /**
       *
       * @param operation
       * @param count
       */
      onDataFetched: (operation, count) => {
        logger.debug(`Firebase: ${operation} fetched ${count} items`);
      },
      /**
       *
       * @param operation
       * @param ids
       */
      onDataModified: (operation, ids) => {
        logger.debug(`Firebase: ${operation} modified ${ids.length} items`);
      },
      /**
       *
       * @param operation
       * @param error
       */
      onError: (operation, error) => {
        logger.error(`Firebase: ${operation} failed`, error);
      },
    },
  });
}

/**
 * HOC for components that need PositionService
 * @param Component
 */
export function withPositionService<P extends { positionService: PositionService }>(
  Component: React.ComponentType<P>
): React.ComponentType<Omit<P, 'positionService'>> {
  return function WithPositionServiceComponent(props: Omit<P, 'positionService'>) {
    const positionService = usePositionService();

    // Handle SSR case where service might be null
    if (!positionService) {
      return null;
    }

    return <Component {...(props as P)} positionService={positionService} />;
  };
}
