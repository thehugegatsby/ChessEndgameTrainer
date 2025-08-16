/**
 * Fault Injection Utilities
 * Systematic error injection for resilience testing
 */

import { type Page } from '@playwright/test';

export type FaultType =
  | 'network-error'
  | 'timeout'
  | 'rate-limit'
  | 'auth-failure'
  | 'permission-denied'
  | 'server-error'
  | 'data-corruption'
  | 'offline';

export interface FaultConfig {
  type: FaultType;
  probability?: number; // 0-1, for random injection
  duration?: number; // ms, for temporary faults
  target?: string | RegExp; // specific endpoint/pattern
}

export class FaultInjector {
  private page: Page;
  private activeFaults: Map<string, FaultConfig> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Inject a specific fault
   */
  async inject(fault: FaultConfig): Promise<void> {
    const faultId = `${fault.type}-${Date.now()}`;
    this.activeFaults.set(faultId, fault);

    switch (fault.type) {
      case 'network-error':
        await this.injectNetworkError(fault);
        break;
      case 'timeout':
        await this.injectTimeout(fault);
        break;
      case 'rate-limit':
        await this.injectRateLimit(fault);
        break;
      case 'auth-failure':
        await this.injectAuthFailure(fault);
        break;
      case 'permission-denied':
        await this.injectPermissionDenied(fault);
        break;
      case 'server-error':
        await this.injectServerError(fault);
        break;
      case 'data-corruption':
        await this.injectDataCorruption(fault);
        break;
      case 'offline':
        await this.injectOffline();
        break;
      default:
        // Throw error for unknown fault types
        throw new Error(`Unknown fault type: ${(fault as any).type}`);
    }

    // Auto-remove after duration if specified
    if (fault.duration) {
      setTimeout(() => this.remove(faultId), fault.duration);
    }
  }

  /**
   * Remove a fault
   */
  async remove(faultId: string): Promise<void> {
    this.activeFaults.delete(faultId);
    // Re-apply remaining faults
    await this.reapplyFaults();
  }

  /**
   * Clear all faults
   */
  async clear(): Promise<void> {
    this.activeFaults.clear();
    await this.page.unroute('**/*');
    await this.page.context().setOffline(false);
  }

  /**
   * Network error injection
   */
  private async injectNetworkError(fault: FaultConfig): Promise<void> {
    await this.page.route(fault.target || '**/*', async route => {
      if (this.shouldInject(fault)) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Timeout injection
   */
  private async injectTimeout(fault: FaultConfig): Promise<void> {
    await this.page.route(fault.target || '**/*', async route => {
      if (this.shouldInject(fault)) {
        // Never respond, causing timeout
        // Playwright will timeout after navigationTimeout
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Rate limit injection
   */
  private async injectRateLimit(fault: FaultConfig): Promise<void> {
    await this.page.route(fault.target || '**/*', async route => {
      if (this.shouldInject(fault)) {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: 60,
          }),
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Auth failure injection
   */
  private async injectAuthFailure(fault: FaultConfig): Promise<void> {
    await this.page.route(fault.target || '**/*', async route => {
      if (this.shouldInject(fault)) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Authentication required',
            code: 'UNAUTHENTICATED',
          }),
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Permission denied injection
   */
  private async injectPermissionDenied(fault: FaultConfig): Promise<void> {
    await this.page.route(fault.target || '**/*', async route => {
      if (this.shouldInject(fault)) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Permission denied',
            code: 'PERMISSION_DENIED',
          }),
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Server error injection
   */
  private async injectServerError(fault: FaultConfig): Promise<void> {
    await this.page.route(fault.target || '**/*', async route => {
      if (this.shouldInject(fault)) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            trace: 'Mock stack trace for debugging',
          }),
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Data corruption injection
   */
  private async injectDataCorruption(fault: FaultConfig): Promise<void> {
    await this.page.route(fault.target || '**/*', async route => {
      if (this.shouldInject(fault)) {
        const response = await route.fetch();
        let body = await response.text();

        // Corrupt JSON responses
        if (response.headers()['content-type']?.includes('json')) {
          try {
            const data = JSON.parse(body);
            // Randomly corrupt data
            if (Array.isArray(data)) {
              data.splice(Math.floor(Math.random() * data.length), 1);
            } else if (typeof data === 'object') {
              const keys = Object.keys(data);
              delete data[keys[Math.floor(Math.random() * keys.length)]];
            }
            body = JSON.stringify(data);
          } catch {
            // If not valid JSON, corrupt the string
            body = `${body.substring(0, body.length - 10)}...corrupted`;
          }
        }

        await route.fulfill({
          response,
          body,
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Offline mode injection
   */
  private async injectOffline(): Promise<void> {
    await this.page.context().setOffline(true);
  }

  /**
   * Check if fault should be injected based on probability
   */
  private shouldInject(fault: FaultConfig): boolean {
    if (fault.probability === undefined) return true;
    return Math.random() < fault.probability;
  }

  /**
   * Re-apply all active faults
   */
  private async reapplyFaults(): Promise<void> {
    await this.page.unroute('**/*');

    for (const fault of Array.from(this.activeFaults.values())) {
      await this.inject(fault);
    }
  }
}

/**
 * Fault injection scenarios for common test cases
 */
export const FaultScenarios = {
  // Flaky network (30% failure rate)
  FLAKY_NETWORK: {
    type: 'network-error' as FaultType,
    probability: 0.3,
  },

  // Slow API responses
  SLOW_API: {
    type: 'timeout' as FaultType,
    target: /api/,
    duration: 5000,
  },

  // Firebase auth issues
  FIREBASE_AUTH_DOWN: {
    type: 'auth-failure' as FaultType,
    target: /firebase.*auth/,
  },

  // Firestore permission errors
  FIRESTORE_PERMISSION_ERROR: {
    type: 'permission-denied' as FaultType,
    target: /firestore.*documents/,
  },

  // Complete offline
  OFFLINE_MODE: {
    type: 'offline' as FaultType,
  },
};

/**
 * Chaos testing helper
 */
export class ChaosMonkey {
  private injector: FaultInjector;
  private interval?: NodeJS.Timeout;

  constructor(page: Page) {
    this.injector = new FaultInjector(page);
  }

  /**
   * Start random fault injection
   */
  start(config: { faults: FaultConfig[]; intervalMs: number; maxSimultaneous: number }): void {
    let activeFaults = 0;

    this.interval = setInterval(() => {
      if (activeFaults < config.maxSimultaneous && Math.random() < 0.5) {
        const fault = config.faults[Math.floor(Math.random() * config.faults.length)];
        this.injector.inject(fault);
        activeFaults++;

        // Remove after random duration
        setTimeout(
          () => {
            activeFaults--;
          },
          Math.random() * 10000 + 1000
        );
      }
    }, config.intervalMs);
  }

  /**
   * Stop chaos testing
   */
  async stop(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      await this.injector.clear();
    }
  }
}
