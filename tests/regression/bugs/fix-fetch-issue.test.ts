/**
 * FIX FETCH ISSUE
 * 
 * Der Bug: fetch() gibt {} zurück, aber curl funktioniert
 * Mögliche Ursachen: CORS, Headers, User-Agent, etc.
 */

describe('Fix Fetch Issue for Lichess API', () => {
  const SCREENSHOT_FEN = '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1';
  
  it('sollte verschiedene fetch Konfigurationen testen', async () => {
    const baseUrl = 'https://tablebase.lichess.ovh/standard';
    const url = `${baseUrl}?fen=${encodeURIComponent(SCREENSHOT_FEN)}`;
    
    console.log('=== Testing different fetch configurations ===');
    
    // Test 1: Original fetch (minimal headers)
    try {
      console.log('\n--- Test 1: Minimal headers ---');
      const response1 = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      const data1 = await response1.json();
      console.log('Response 1:', JSON.stringify(data1, null, 2));
    } catch (error) {
      console.log('Error 1:', error);
    }
    
    // Test 2: Mit User-Agent (wie curl)
    try {
      console.log('\n--- Test 2: With User-Agent ---');
      const response2 = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Chess-Trainer/1.0)'
        }
      });
      const data2 = await response2.json();
      console.log('Response 2:', JSON.stringify(data2, null, 2));
    } catch (error) {
      console.log('Error 2:', error);
    }
    
    // Test 3: Mehr Headers
    try {
      console.log('\n--- Test 3: More headers ---');
      const response3 = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Chess-Trainer/1.0)',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });
      const data3 = await response3.json();
      console.log('Response 3:', JSON.stringify(data3, null, 2));
    } catch (error) {
      console.log('Error 3:', error);
    }
    
    // Test 4: Prüfe Response-Details
    try {
      console.log('\n--- Test 4: Response details ---');
      const response4 = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log('Status:', response4.status, response4.statusText);
      console.log('Headers:', [...response4.headers.entries()]);
      console.log('Content-Type:', response4.headers.get('content-type'));
      
      const text = await response4.text();
      console.log('Raw text:', text);
      
      try {
        const parsed = JSON.parse(text);
        console.log('Parsed JSON:', parsed);
      } catch (parseError) {
        console.log('JSON parse error:', parseError);
      }
      
    } catch (error) {
      console.log('Error 4:', error);
    }
  }, 30000);
  
  it('sollte prüfen ob das Problem in unserem tablebase.ts liegt', async () => {
    // Import our tablebase service
    const { tablebaseService } = await import('@/lib/chess/tablebase');
    
    console.log('=== Testing our tablebase service ===');
    
    try {
      const result = await tablebaseService.queryPosition(SCREENSHOT_FEN);
      console.log('Our service result:', JSON.stringify(result, null, 2));
      
      if (result.result) {
        console.log('WDL:', result.result.wdl);
        console.log('Category:', result.result.category);
        console.log('DTZ:', result.result.dtz);
      }
    } catch (error) {
      console.log('Our service error:', error);
    }
  }, 15000);
});