import { getMoveQualityByTablebaseComparison } from '@shared/utils/chess/evaluationHelpers';

describe('Tablebase Move Quality - Real Lichess API Data', () => {
  // Real API response for position BEFORE Kd7:
  // 2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1
  const apiResponseBeforeKd7 = {
    "checkmate": false,
    "stalemate": false,
    "variant_win": false,
    "variant_loss": false,
    "insufficient_material": false,
    "dtz": 9,
    "precise_dtz": 9,
    "dtm": 31,
    "category": "win",  // White wins
    "moves": [
      {
        "uci": "c8d7",
        "san": "Kd7",
        "category": "loss"  // After Kd7, it's Black's turn and Black loses
      }
    ]
  };

  // Real API response for position AFTER Kd7:
  // 8/2PK1k2/8/8/4R3/8/1r6/8 b - - 1 1
  const apiResponseAfterKd7 = {
    "checkmate": false,
    "stalemate": false,
    "variant_win": false,
    "variant_loss": false,
    "insufficient_material": false,
    "dtz": -10,
    "precise_dtz": -10,
    "dtm": -30,
    "category": "loss",  // Black loses (= White wins)
    "moves": [
      {
        "uci": "b2d2",
        "san": "Rd2+",
        "category": "win"  // After Rd2+, it's White's turn and White wins
      }
    ]
  };

  // Real API response for position AFTER Rd2+:
  // 8/2PK1k2/8/8/4R3/8/3r4/8 w - - 2 2
  const apiResponseAfterRd2 = {
    "checkmate": false,
    "stalemate": false,
    "variant_win": false,
    "variant_loss": false,
    "insufficient_material": false,
    "dtz": 9,
    "precise_dtz": 9,
    "dtm": 29,
    "category": "win",  // White wins
    "moves": [
      {
        "uci": "d7c6",
        "san": "Kc6",
        "category": "loss"  // Still winning for White
      },
      {
        "uci": "e4d4",
        "san": "Rd4",
        "category": "draw"  // This would be an error - throwing away the win!
      }
    ]
  };

  // Helper to convert category to WDL
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

  it('should show Kd7 as best move maintaining the win', () => {
    // From the API data:
    const wdlBefore = categoryToWdl(apiResponseBeforeKd7.category); // 2 (win)
    const wdlAfter = categoryToWdl(apiResponseAfterKd7.category);   // -2 (loss)
    
    // CRITICAL: After White plays Kd7, it's Black's turn
    // The API says "loss" which means Black loses = White still wins!
    
    const moveQuality = getMoveQualityByTablebaseComparison(
      wdlBefore,  // 2 (White wins)
      wdlAfter,   // -2 (Black loses = White still wins)
      'w'         // White's move
    );
    
    // Should show as "Sieg gehalten" (win maintained) = ✅
    expect(moveQuality.text).toBe('✅');
    expect(moveQuality.className).toContain('eval-excellent');
  });

  it('should show Rd2+ as best defense for Black', () => {
    // From the API data:
    const wdlBefore = categoryToWdl(apiResponseAfterKd7.category); // -2 (loss for Black)
    const wdlAfter = categoryToWdl(apiResponseAfterRd2.category);  // 2 (win for White)
    
    // Black is losing before and after, but Rd2+ is the best defense
    
    const moveQuality = getMoveQualityByTablebaseComparison(
      wdlBefore,  // -2 (Black loses)
      wdlAfter,   // 2 (White wins = Black still loses)
      'b'         // Black's move
    );
    
    // Should show as optimal defense (shield) = 🛡️
    expect(moveQuality.text).toBe('🛡️');
    expect(moveQuality.className).toContain('eval-neutral');
  });

  it('should show Rd4 as error throwing away the win', () => {
    // From the API data, Rd4 has category "draw"
    const wdlBefore = categoryToWdl(apiResponseAfterRd2.category); // 2 (win)
    const wdlAfterRd4 = categoryToWdl('draw');                     // 0 (draw)
    
    const moveQuality = getMoveQualityByTablebaseComparison(
      wdlBefore,    // 2 (White wins)
      wdlAfterRd4,  // 0 (Draw)
      'w'           // White's move
    );
    
    // Should show as catastrophic error - 🚨
    expect(moveQuality.text).toBe('🚨');
    expect(moveQuality.className).toContain('eval-blunder');
  });

  it('should correctly identify win maintained when WDL changes sign due to perspective', () => {
    // This is the core issue: When White makes a winning move,
    // the WDL often changes from +2 to -2 because it switches to Black's perspective
    
    // Before: White to move, White wins (wdl = 2)
    // After: Black to move, Black loses (wdl = -2)
    // This is NOT throwing away the win!
    
    const moveQuality = getMoveQualityByTablebaseComparison(
      2,   // Before: White wins
      -2,  // After: Black loses (= White still wins!)
      'w'  // White made the move
    );
    
    expect(moveQuality.text).toBe('✅'); // Win maintained
    expect(moveQuality.className).toContain('eval-excellent');
    expect(moveQuality.className).not.toContain('eval-blunder');
  });
});