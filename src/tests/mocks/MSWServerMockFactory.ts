/**
 * MSW Server Mock Factory
 * 
 * Manages Mock Service Worker server instances for API mocking.
 * Ensures proper setup and teardown of MSW handlers.
 */

// @ts-nocheck - Test infrastructure with complex mock typing

import { setupServer, SetupServer } from 'msw/node';
import { http, HttpHandler } from 'msw';
import { BaseMockFactory } from './BaseMockFactory';

export interface MSWServerMockOverrides {
  handlers?: HttpHandler[];
  baseUrl?: string;
}

export interface MockedMSWServer {
  server: SetupServer;
  addHandler: (handler: HttpHandler) => void;
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
      http.get(`${this.baseUrl}/standard`, () => {
        return new Response(
          JSON.stringify({
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
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }),

      // Health check endpoint
      http.get(`${this.baseUrl}/health`, () => {
        return new Response(
          JSON.stringify({ status: 'ok' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
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
      addHandler: (handler: HttpHandler) => {
        this.server!.use(handler);
      },
      resetHandlers: () => {
        this.server!.resetHandlers();
      },
      close: () => {
        this.server!.close();
      },
    } as unknown as MockedMSWServer;
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
      http.get(`${this.baseUrl}/standard`, ({ request }) => {
        const url = new URL(request.url);
        const queryFen = url.searchParams.get('fen');
        if (queryFen === fen) {
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        // Let other handlers handle it
        return Response.json({ error: 'FEN not found' }, { status: 404 });
      })
    );
  }

  /**
   * Helper to mock a tablebase error
   */
  public mockTablebaseError(statusCode: number = 500, message?: string): void {
    if (!this.server) return;

    this.server.use(
      http.get(`${this.baseUrl}/standard`, () => {
        return Response.json(
          { error: message || 'Internal server error' },
          { status: statusCode }
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
      http.get(endpoint, async () => {
        // Delay longer than typical timeout
        await new Promise(resolve => setTimeout(resolve, delay));
        return Response.json(
          { error: 'Request timeout' },
          { status: 408 }
        );
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
      http.get(`${this.baseUrl}/*`, () => {
        requestCount++;
        if (requestCount > limit) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded' }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '60'
              }
            }
          );
        }
        // Passthrough for other handlers
        return new Response(null, { status: 200 });
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