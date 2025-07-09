/**
 * @fileoverview Mock Worker for Playwright E2E Tests
 * @description Provides instant, deterministic responses for chess engine queries
 * replacing the slow Stockfish WASM worker (10+ seconds → 1-10ms)
 * 
 * Based on MockEngineService patterns for consistent test behavior
 */

export interface MockWorkerMessage {
  type: string;
  data: any;
}

export interface MockWorkerResponse {
  bestMove: string;
  evaluation: number;
  depth: number;
}

/**
 * Mock Worker class that replaces the real Web Worker in tests
 * Provides instant, deterministic responses for chess engine analysis
 */
export class MockWorker {
  private onmessage: ((event: MessageEvent) => void) | null = null;
  private responses: Map<string, MockWorkerResponse> = new Map();
  
  constructor(scriptURL: string) {
    console.log('[MockWorker] Created for:', scriptURL);
    this.setupDefaultResponses();
  }

  /**
   * Mock postMessage - processes engine commands instantly
   */
  postMessage(message: any): void {
    console.log('[MockWorker] Received:', message);
    
    // Simulate async response with minimal delay
    setTimeout(() => {
      if (this.onmessage) {
        const response = this.generateResponse(message);
        this.onmessage(new MessageEvent('message', { data: response }));
      }
    }, 5); // 5ms delay for realistic async behavior
  }

  /**
   * Generate appropriate response based on message type
   */
  private generateResponse(message: any): any {
    // Handle Stockfish UCI protocol
    if (typeof message === 'string') {
      if (message.startsWith('position')) {
        // Extract FEN from position command
        const fenMatch = message.match(/position fen ([^\s]+)/);
        if (fenMatch) {
          return this.generateAnalysisResponse(fenMatch[1]);
        }
      }
      
      if (message === 'uci') {
        return 'uciok';
      }
      
      if (message === 'isready') {
        return 'readyok';
      }
      
      if (message.startsWith('go')) {
        // Return a generic best move for go commands
        return 'bestmove e2e4';
      }
    }
    
    // Default response
    return { type: 'ready', data: true };
  }

  /**
   * Generate analysis response for specific position
   */
  private generateAnalysisResponse(fen: string): string {
    const response = this.responses.get(fen) || this.generateDefaultResponse(fen);
    
    // Format as Stockfish info string
    return `info depth ${response.depth} score cp ${response.evaluation} pv ${response.bestMove}
bestmove ${response.bestMove}`;
  }

  /**
   * Setup default responses for common test positions
   */
  private setupDefaultResponses(): void {
    // Opposition training position 1
    this.responses.set('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', {
      bestMove: 'Kd6',
      evaluation: 80,
      depth: 20
    });
    
    // After 1.Kd6
    this.responses.set('4k3/8/3K4/4P3/8/8/8/8 b - - 1 1', {
      bestMove: 'Kd8',
      evaluation: -80,
      depth: 20
    });
    
    // Brückenbau position
    this.responses.set('8/8/8/ppp5/3P4/PPP5/8/8 w - - 0 1', {
      bestMove: 'Kd7',
      evaluation: 150,
      depth: 25
    });
    
    // Add more positions as needed
  }

  /**
   * Generate reasonable default response for unknown positions
   */
  private generateDefaultResponse(fen: string): MockWorkerResponse {
    // Simple hash to generate consistent responses
    const hash = this.hashFen(fen);
    const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'd4', 'd5'];
    
    return {
      bestMove: moves[hash % moves.length],
      evaluation: (hash % 200) - 100,
      depth: 15 + (hash % 10)
    };
  }

  /**
   * Simple hash function for deterministic responses
   */
  private hashFen(fen: string): number {
    let hash = 0;
    for (let i = 0; i < fen.length; i++) {
      hash = ((hash << 5) - hash) + fen.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Mock terminate method
   */
  terminate(): void {
    console.log('[MockWorker] Terminated');
    this.onmessage = null;
    this.responses.clear();
  }

  /**
   * Mock addEventListener
   */
  addEventListener(event: string, handler: any): void {
    if (event === 'message') {
      this.onmessage = handler;
    }
  }

  /**
   * Mock removeEventListener
   */
  removeEventListener(event: string, handler: any): void {
    if (event === 'message' && this.onmessage === handler) {
      this.onmessage = null;
    }
  }
}

/**
 * Install mock worker in page context
 * Call this in beforeEach() of your Playwright tests
 */
export async function installMockWorker(page: any): Promise<void> {
  // First inject the MockWorker class definition
  await page.addInitScript(`
    ${MockWorker.toString()}
    (globalThis as any).MockWorker = MockWorker;
  `);
  
  // Then override the Worker constructor
  await page.addInitScript(() => {
    // Store original Worker
    const OriginalWorker = globalThis.Worker;
    
    // Replace with MockWorker
    (globalThis as any).Worker = class extends (globalThis as any).MockWorker {
      constructor(scriptURL: string) {
        console.log('[Test] Worker intercepted:', scriptURL);
        
        // Only mock Stockfish worker
        if (scriptURL.includes('stockfish')) {
          super(scriptURL);
        } else {
          // Use original Worker for non-Stockfish workers
          return new OriginalWorker(scriptURL);
        }
      }
    };
  });
}