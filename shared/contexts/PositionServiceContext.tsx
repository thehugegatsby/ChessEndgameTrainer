"use client";

/**
 * Position Service Context
 * Provides dependency injection for PositionService throughout the React app
 */

import React, { createContext, useContext, useMemo } from "react";
import { PositionService } from "@shared/services/database/PositionService";
import {
  IPositionService,
  IPositionServiceConfig,
} from "@shared/services/database/IPositionService";
import { IPositionRepository } from "@shared/repositories/IPositionRepository";
import { FirebasePositionRepository } from "@shared/repositories/implementations/FirebasePositionRepository";
import { MockPositionRepository } from "@shared/repositories/implementations/MockPositionRepository";
import { db } from "@shared/lib/firebase";
import {
  shouldUseMockService,
  createMockPositionRepository,
} from "@shared/testing/MockPositionServiceFactory";
import { CACHE } from "@shared/constants";

/**
 * Context value type
 */
interface PositionServiceContextValue {
  positionService: IPositionService;
  repository: IPositionRepository;
}

/**
 * React Context
 */
const PositionServiceContext = createContext<
  PositionServiceContextValue | undefined
>(undefined);

/**
 * Provider props
 */
interface PositionServiceProviderProps {
  children: React.ReactNode;
  /**
   * Override the default repository (useful for testing)
   */
  repository?: IPositionRepository;
  /**
   * Service configuration
   */
  config?: IPositionServiceConfig;
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
    const service = new PositionService(repo, config);

    return {
      positionService: service,
      repository: repo,
    };
  }, [repository, config]);

  return (
    <PositionServiceContext.Provider value={value}>
      {children}
    </PositionServiceContext.Provider>
  );
};

/**
 * Hook to access PositionService
 */
export /**
 *
 */
const usePositionService = (): IPositionService => {
  const context = useContext(PositionServiceContext);

  if (!context) {
    throw new Error(
      "usePositionService must be used within PositionServiceProvider",
    );
  }

  return context.positionService;
};

/**
 * Hook to access the repository directly (mainly for testing)
 */
export /**
 *
 */
const usePositionRepository = (): IPositionRepository => {
  const context = useContext(PositionServiceContext);

  if (!context) {
    throw new Error(
      "usePositionRepository must be used within PositionServiceProvider",
    );
  }

  return context.repository;
};

/**
 * Create default repository based on environment
 */
function createDefaultRepository(): IPositionRepository {
  // Use pre-seeded mock repository for E2E tests (bypasses Firebase completely)
  if (shouldUseMockService()) {
    console.log(
      "Using MockPositionRepository with pre-seeded test data for E2E testing",
    );
    return createMockPositionRepository();
  }

  // Use mock repository in unit test environment
  if (process.env.NODE_ENV === "test" && !process.env.USE_REAL_FIREBASE) {
    console.log("Using MockPositionRepository for unit testing");
    return new MockPositionRepository({
      enableCache: true,
      events: {
        /**
         *
         * @param operation
         * @param count
         */
        onDataFetched: (operation, count) => {
          console.log(`Mock: ${operation} fetched ${count} items`);
        },
      },
    });
  }

  // Use Firebase repository in production/development
  console.log("Using FirebasePositionRepository");
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
        console.log(`Firebase: ${operation} fetched ${count} items`);
      },
      /**
       *
       * @param operation
       * @param ids
       */
      onDataModified: (operation, ids) => {
        console.log(`Firebase: ${operation} modified ${ids.length} items`);
      },
      /**
       *
       * @param operation
       * @param error
       */
      onError: (operation, error) => {
        console.error(`Firebase: ${operation} failed`, error);
      },
    },
  });
}

/**
 * HOC for components that need PositionService
 * @param Component
 */
export function withPositionService<
  P extends { positionService: IPositionService },
>(
  Component: React.ComponentType<P>,
): React.ComponentType<Omit<P, "positionService">> {
  return function WithPositionServiceComponent(
    props: Omit<P, "positionService">,
  ) {
    const positionService = usePositionService();

    return <Component {...(props as P)} positionService={positionService} />;
  };
}
