/**
 * DIRECT LICHESS API TEST
 * 
 * Testet direkt die Lichess Tablebase API für unsere problematische Position
 * um zu sehen was tatsächlich zurückkommt vs. was wir erwarten
 */

describe('Lichess Tablebase API Direct Test', () => {
  const SCREENSHOT_FEN = '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1';
  
  it('sollte direkt die Lichess API für die Screenshot-Position abfragen', async () => {
    const url = `https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(SCREENSHOT_FEN)}`;
    
    console.log('=== DIRECT LICHESS API CALL ===');
    console.log('URL:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.log('API Error:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      
      console.log('=== RAW LICHESS RESPONSE ===');
      console.log(JSON.stringify(data, null, 2));
      
      // Analysiere die Antwort
      console.log('=== ANALYSIS ===');
      console.log('Category:', data.category);
      console.log('DTZ:', data.dtz);
      console.log('Precise DTZ:', data.precise_dtz);
      console.log('Moves length:', data.moves?.length);
      
      if (data.moves && data.moves.length > 0) {
        console.log('=== FIRST FEW MOVES ===');
        data.moves.slice(0, 5).forEach((move: any, index: number) => {
          console.log(`${index + 1}. ${move.san} (${move.uci}) - Category: ${move.category}, DTZ: ${move.dtz}`);
        });
        
        // Suche speziell nach Kd7
        const kd7Move = data.moves.find((move: any) => 
          move.san === 'Kd7' || move.uci === 'c8d7'
        );
        
        if (kd7Move) {
          console.log('=== Kd7 MOVE FOUND ===');
          console.log('SAN:', kd7Move.san);
          console.log('UCI:', kd7Move.uci);
          console.log('Category:', kd7Move.category);
          console.log('DTZ:', kd7Move.dtz);
        } else {
          console.log('❌ Kd7 move NOT found in response');
        }
      }
      
      // Erwartung vs. Realität
      console.log('=== EXPECTATION vs REALITY ===');
      console.log('Expected category: win (da Weiß gewinnt)');
      console.log('Actual category:', data.category);
      console.log('Expected WDL: 2');
      console.log('Calculated WDL:', categoryToWdl(data.category));
      
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }, 15000);
  
  it('sollte die Piece Count korrekt berechnen', () => {
    const position = SCREENSHOT_FEN.split(' ')[0]; // "2K5/2P2k2/8/8/4R3/8/1r6/8"
    const pieceCount = position.replace(/[^a-zA-Z]/g, '').length;
    
    console.log('=== PIECE COUNT ===');
    console.log('Position part:', position);
    console.log('Pieces found:', position.replace(/[^a-zA-Z]/g, ''));
    console.log('Piece count:', pieceCount);
    
    // Erwartung: K + P + k + R + r = 5 pieces
    expect(pieceCount).toBe(5);
    expect(pieceCount).toBeLessThanOrEqual(7); // Sollte in Tablebase sein
  });
});

// Helper function to convert category to WDL (copied from tablebase.ts)
function categoryToWdl(category: string): number {
  switch (category) {
    case 'win': return 2;
    case 'cursed-win': return 1;
    case 'draw': return 0;
    case 'blessed-loss': return -1;
    case 'loss': return -2;
    default: return 0;
  }
}