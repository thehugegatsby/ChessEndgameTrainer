/**
 * PRODUCTION TABLEBASE TEST
 * 
 * Testet ob die Tablebase API in einer echteren Umgebung funktioniert
 * Verwendet node-fetch um JSDOM-Probleme zu umgehen
 */

// Use node-fetch for more realistic testing
const nodeFetch = require('node-fetch');

describe('Production Tablebase API Test', () => {
  const SCREENSHOT_FEN = '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1';
  
  it('sollte mit node-fetch die korrekte API-Antwort bekommen', async () => {
    const url = `https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(SCREENSHOT_FEN)}`;
    
    console.log('=== NODE-FETCH TEST ===');
    
    try {
      const response = await nodeFetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Chess-Endgame-Trainer/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('=== SUCCESSFUL RESPONSE ===');
      console.log('Category:', data.category);
      console.log('DTZ:', data.dtz);
      console.log('Moves count:', data.moves?.length);
      
      // Verify this is a winning position
      expect(data.category).toBe('win');
      expect(data.dtz).toBeDefined();
      expect(data.moves).toBeDefined();
      expect(data.moves.length).toBeGreaterThan(0);
      
      // Find Kd7 move specifically
      const kd7Move = data.moves.find((move: any) => 
        move.san === 'Kd7' || move.uci === 'c8d7'
      );
      
      console.log('=== Kd7 MOVE ANALYSIS ===');
      if (kd7Move) {
        console.log('Found Kd7:', kd7Move.san, kd7Move.uci);
        console.log('Category:', kd7Move.category);
        console.log('DTZ:', kd7Move.dtz);
        
        // This should be a loss (from the perspective after the move)
        // Since we're in a winning position, any move that maintains win should be negative DTZ
        expect(kd7Move.category).toBe('loss'); // Loss for the opponent = good for us
        expect(kd7Move.dtz).toBeLessThan(0); // Negative DTZ means opponent loses
      } else {
        console.log('❌ Kd7 move not found in moves list');
        fail('Kd7 move should be in the moves list');
      }
      
    } catch (error) {
      console.error('Node-fetch error:', error);
      fail(`API call failed: ${error}`);
    }
  }, 15000);
  
  it('sollte unseren tablebaseService mit Mock-Fix testen', async () => {
    // Import our tablebase service  
    const tablebaseModule = await import('@/lib/chess/tablebase');
    
    // Mock fetch to return the correct data (since JSDOM fetch is broken)
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        category: 'win',
        dtz: 9,
        precise_dtz: 9,
        moves: [
          {
            uci: 'c8d7',
            san: 'Kd7', 
            category: 'loss',
            dtz: -10,
            precise_dtz: -10
          }
        ]
      })
    });
    
    // Replace global fetch
    (global as any).fetch = mockFetch;
    
    console.log('=== TESTING OUR SERVICE WITH MOCK ===');
    
    const result = await tablebaseModule.tablebaseService.queryPosition(SCREENSHOT_FEN);
    
    console.log('Service result:', JSON.stringify(result, null, 2));
    
    // Verify our service correctly processes the API response
    expect(result.isTablebasePosition).toBe(true);
    expect(result.result?.category).toBe('win');
    expect(result.result?.wdl).toBe(2); // win = 2 in our system
    expect(result.result?.dtz).toBe(9);
    
    // Verify the move data is also parsed correctly
    // Note: The moves are not directly exposed in our current API, but the position evaluation is correct
    
    console.log('✅ Our service correctly processes valid API responses');
  }, 10000);
});