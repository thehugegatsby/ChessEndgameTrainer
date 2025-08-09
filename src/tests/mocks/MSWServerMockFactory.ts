/**
 * MSW Server Mock Factory
 * 
 * Manages Mock Service Worker server instances for API mocking.
 * Ensures proper setup and teardown of MSW handlers.
 */

import { setupServer, SetupServer } from 'msw/node';
import { rest, RestHandler } from 'msw';
import { BaseMockFactory } from './BaseMockFactory';

export interface MSWServerMockOverrides {
  handlers?: RestHandler[];
  baseUrl?: string;
}

export interface MockedMSWServer {
  server: SetupServer;
  addHandler: (handler: RestHandler) => void;
  resetHandlers: () => void;
  close: () => void;
}

export class MSWServerMockFactory extends BaseMockFactory<MockedMSWServer, MSWServerMockOverrides> {
  private server: SetupServer | null = null;
  private baseUrl = 'https://tablebase.lichess.ovh';

  protected _createDefaultMock(): MockedMSWServer {
    // Create default handlers for common endpoints
    const defaultHandlers = [
      // Lichess Tablebase API
      rest.get(`${this.baseUrl}/standard`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            category: 'win',
            dtz: 5,
            dtm: 3,
            moves: [
              {
                uci: 'e2e4',
                san: 'e4',
                category: 'win',
                dtz: 4,
                dtm: 2,
              },
            ],
          })
        );
      }),

      // Health check endpoint
      rest.get(`${this.baseUrl}/health`, (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ status: 'ok' }));
      }),
    ];

    // Create and configure server
    this.server = setupServer(...defaultHandlers);

    // Start the server
    this.server.listen({
      onUnhandledRequest: 'warn', // Warn about unhandled requests in tests
    });

    // Register cleanup callback
    this.registerCleanup(() => {
      if (this.server) {
        this.server.close();
      }
    });

    // Return mock interface
    return {
      server: this.server,
      addHandler: (handler: RestHandler) => {
        this.server!.use(handler);
      },
      resetHandlers: () => {
        this.server!.resetHandlers();
      },
      close: () => {
        this.server!.close();
      },
    };
  }

  protected _mergeOverrides(
    defaultMock: MockedMSWServer,
    overrides?: MSWServerMockOverrides
  ): MockedMSWServer {
    if (!overrides) return defaultMock;

    // Apply base URL override
    if (overrides.baseUrl) {
      this.baseUrl = overrides.baseUrl;
    }

    // Apply custom handlers
    if (overrides.handlers && overrides.handlers.length > 0) {
      // Reset to use only the provided handlers
      this.server!.resetHandlers(...overrides.handlers);
    }

    return defaultMock;
  }

  protected _beforeCleanup(): void {
    if (this.server) {
      // Reset handlers to defaults before cleanup
      this.server.resetHandlers();
      
      // Close the server
      this.server.close();
      
      this.server = null;
    }
  }

  /**
   * Helper to mock a successful tablebase response
   */
  public mockTablebaseSuccess(fen: string, result: any): void {
    if (!this.server) return;

    this.server.use(
      rest.get(`${this.baseUrl}/standard`, (req, res, ctx) => {
        const queryFen = req.url.searchParams.get('fen');
        if (queryFen === fen) {
          return res(ctx.status(200), ctx.json(result));
        }
        // Let other handlers handle it
        return req.passthrough();
      })
    );
  }

  /**
   * Helper to mock a tablebase error
   */
  public mockTablebaseError(statusCode: number = 500, message?: string): void {
    if (!this.server) return;

    this.server.use(
      rest.get(`${this.baseUrl}/standard`, (req, res, ctx) => {
        return res(
          ctx.status(statusCode),
          ctx.json({ error: message || 'Internal server error' })
        );
      })
    );
  }

  /**
   * Helper to simulate network timeout
   */
  public mockNetworkTimeout(endpoint: string, delay: number = 5000): void {
    if (!this.server) return;

    this.server.use(
      rest.get(endpoint, async (req, res, ctx) => {
        // Delay longer than typical timeout
        await new Promise(resolve => setTimeout(resolve, delay));
        return res(ctx.status(408), ctx.json({ error: 'Request timeout' }));
      })
    );
  }

  /**
   * Helper to simulate rate limiting
   */
  public mockRateLimit(): void {
    if (!this.server) return;

    let requestCount = 0;
    const limit = 3;

    this.server.use(
      rest.get(`${this.baseUrl}/*`, (req, res, ctx) => {
        requestCount++;
        if (requestCount > limit) {
          return res(
            ctx.status(429),
            ctx.json({ error: 'Rate limit exceeded' }),
            ctx.set('Retry-After', '60')
          );
        }
        return req.passthrough();
      })
    );
  }

  /**
   * Reset request counters and state
   */
  public reset(): void {
    if (this.server) {
      this.server.resetHandlers();
    }
  }
}