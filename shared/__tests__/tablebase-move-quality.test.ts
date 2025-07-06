import { getMoveQualityByTablebaseComparison } from '@shared/utils/chess/evaluationHelpers';

describe('Tablebase Move Quality - Kd7 Scenario', () => {
  // Test 0: Verify the perspective logic is correct
  it('should correctly interpret WDL values from different perspectives', () => {
    // When White plays a move that maintains the win:
    // - Before move: wdl = 2 (White wins)
    // - After move: wdl = -2 (it's Black's turn, Black loses = White still wins)
    
    // This should NOT be interpreted as throwing away the win!
    const moveQuality = getMoveQualityByTablebaseComparison(
      2,   // Before: White wins
      -2,  // After: Black loses (= White still wins)
      'w'  // White made the move
    );
    
    // Should show as win maintained, not as error!
    expect(moveQuality.text).toBe('✅'); // Win maintained
    expect(moveQuality.className).not.toContain('eval-blunder');
    expect(moveQuality.className).toContain('eval-excellent');
  });

  // Test 1: Kd7 should be shown as the best move (maintaining win)
  it('should show Kd7 as best move maintaining the win', () => {
    // Scenario: White plays Kd7 in a winning position
    // Before: White has a tablebase win (wdl = 2)
    // After: Position is still won for White (Black to move, Black loses = wdl -2)
    
    const wdlBefore = 2;  // White wins before the move
    const wdlAfter = -2;  // After Kd7: Black to move and Black loses (= White still wins)
    
    // Get move quality for White's move Kd7
    const moveQuality = getMoveQualityByTablebaseComparison(
      wdlBefore,  // 2 (White wins)
      wdlAfter,   // -2 (Black loses = White still wins)
      'w'         // White's move
    );
    
    // Should show as "Sieg gehalten" (win maintained) = ✅
    expect(moveQuality.text).toBe('✅');
    expect(moveQuality.className).toContain('eval-excellent');
  });

  // Test 2: Rd2+ should be shown as best defense for Black
  it('should show Rd2+ as best defense for Black', () => {
    // Scenario: Black plays Rd2+ in a losing position
    // Before: Black is losing (wdl = -2)
    // After: Position is still lost for Black but it's the best defense
    
    const wdlBefore = -2; // Black loses before the move
    const wdlAfter = 2;   // After Rd2+: White to move and White wins (= Black still loses)
    
    // Get move quality for Black's move Rd2+
    const moveQuality = getMoveQualityByTablebaseComparison(
      wdlBefore,  // -2 (Black loses)
      wdlAfter,   // 2 (White wins = Black still loses)  
      'b'         // Black's move
    );
    
    // Should show as optimal defense (shield) = 🛡️
    expect(moveQuality.text).toBe('🛡️');
    expect(moveQuality.className).toContain('eval-neutral');
  });

  // Test 3: Rd4 should be shown as error (win to draw)
  it('should show Rd4 as error throwing away the win', () => {
    // Scenario: White plays Rd4 and throws away the win
    // Before: White has a win (wdl = 2)
    // After: Position is only a draw (wdl = 0)
    
    const wdlBefore = 2;  // White wins before the move
    const wdlAfter = 0;   // After Rd4: Draw (throwing away the win)
    
    // Get move quality for White's move Rd4
    const moveQuality = getMoveQualityByTablebaseComparison(
      wdlBefore,  // 2 (White wins)
      wdlAfter,   // 0 (Draw)
      'w'         // White's move
    );
    
    // Should show as error - NOT red down arrow but alarm!
    // Win -> Draw is a catastrophic error
    expect(moveQuality.text).toBe('🚨'); // Alarm for catastrophic error
    expect(moveQuality.className).toContain('eval-blunder');
  });
});