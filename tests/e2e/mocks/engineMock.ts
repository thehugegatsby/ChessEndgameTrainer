/**
 * @fileoverview Engine Mock for E2E Tests
 * @version 1.0.0
 * @description Mocks Stockfish engine responses to eliminate wait times in E2E tests
 */

import { Page } from '@playwright/test';

export interface MockEngineResponse {
  bestMove: string;
  evaluation: number;
  depth: number;
  time: number;
}

/**
 * Predefined engine responses for common positions
 */
const POSITION_RESPONSES: Record<string, MockEngineResponse> = {
  // Opposition training position 1 - Initial position
  '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1': {
    bestMove: 'Kd6',
    evaluation: 0.8,
    depth: 20,
    time: 50
  },
  
  // After 1.Kd6
  '4k3/8/3K4/4P3/8/8/8/8 b - - 1 1': {
    bestMove: 'Kd8',
    evaluation: -0.8,
    depth: 20,
    time: 45
  },
  
  // After 1.Kd6 Kd8 2.Ke6
  '3k4/8/4K3/4P3/8/8/8/8 b - - 3 2': {
    bestMove: 'Ke8',
    evaluation: -0.9,
    depth: 22,
    time: 40
  },
  
  // Losing line: After 1.Kd5 (bad move)
  '4k3/8/8/3K4/4P3/8/8/8 b - - 1 1': {
    bestMove: 'Kd7',
    evaluation: -1.5,
    depth: 18,
    time: 35
  },
  
  // Default fallback for unknown positions
  'default': {
    bestMove: 'Ke2',
    evaluation: 0.0,
    depth: 15,
    time: 30
  }
};

/**
 * Setup engine mocking for a page
 */
export async function setupEngineMocking(page: Page): Promise<void> {
  // Mock Stockfish Worker requests
  await page.route('**/stockfish*.js', async (route) => {
    console.log('🚫 Blocked Stockfish Worker load');
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        // Mock Stockfish Worker
        self.onmessage = function(e) {
          const command = e.data;
          
          if (command === 'uci') {
            self.postMessage('uciok');
          } else if (command === 'isready') {
            self.postMessage('readyok');
          } else if (command.startsWith('position')) {
            // Extract FEN from position command
            const fenMatch = command.match(/fen (.+?)(?:\\s+moves|$)/);
            const fen = fenMatch ? fenMatch[1] : null;
            
            if (fen) {
              setTimeout(() => {
                const response = getMockResponse(fen);
                self.postMessage(\`info depth \${response.depth} score cp \${Math.round(response.evaluation * 100)} time \${response.time}\`);
                self.postMessage(\`bestmove \${response.bestMove}\`);
              }, 10); // Instant response
            }
          }
        };
        
        function getMockResponse(fen) {
          const responses = ${JSON.stringify(POSITION_RESPONSES)};
          return responses[fen] || responses.default;
        }
      `
    });
  });
  
  // Mock WASM files
  await page.route('**/stockfish*.wasm', async (route) => {
    console.log('🚫 Blocked Stockfish WASM load');
    route.fulfill({
      status: 200,
      contentType: 'application/wasm',
      body: Buffer.alloc(0) // Empty buffer
    });
  });
  
  // Mock any engine API calls
  await page.route('**/api/engine/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    
    console.log(`🚫 Blocked Engine API: ${method} ${url}`);
    
    // Return mock response
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        evaluation: 0.5,
        bestMove: 'Ke2',
        time: 10
      })
    });
  });
  
  console.log('✅ Engine mocking setup complete');
}

/**
 * Add custom mock responses for specific positions
 */
export async function addMockResponse(fen: string, response: MockEngineResponse): Promise<void> {
  POSITION_RESPONSES[fen] = response;
}

/**
 * Clear all mock responses
 */
export function clearMockResponses(): void {
  Object.keys(POSITION_RESPONSES).forEach(key => {
    if (key !== 'default') {
      delete POSITION_RESPONSES[key];
    }
  });
}