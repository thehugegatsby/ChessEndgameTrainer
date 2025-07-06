import { getMoveQualityByTablebaseComparison } from '@shared/utils/chess/evaluationHelpers';

describe('Debug WDL Logic', () => {
  it('should debug what happens with Kd7', () => {
    // When White plays Kd7:
    // Before: wdl = 2 (White wins)
    // After: wdl = -2 (Black's turn, Black loses = White still wins)
    
    const wdlBefore = 2;
    const wdlAfter = -2;
    const playerSide = 'w';
    
    // Debug: Let's trace through the function logic
    
    // Step 1: Perspective conversion
    const wdlBeforeFromPlayerPerspective = playerSide === 'w' ? wdlBefore : -wdlBefore;
    const wdlAfterFromPlayerPerspective = playerSide === 'w' ? wdlAfter : -wdlAfter;
    
    console.log('Debug Kd7:');
    console.log('  Raw WDL before:', wdlBefore);
    console.log('  Raw WDL after:', wdlAfter);
    console.log('  Player side:', playerSide);
    console.log('  WDL before (player perspective):', wdlBeforeFromPlayerPerspective);
    console.log('  WDL after (player perspective):', wdlAfterFromPlayerPerspective);
    
    // Step 2: Categories
    const getCategory = (wdl: number) => {
      if (wdl >= 1) return 'win';
      if (wdl <= -1) return 'loss';
      return 'draw';
    };
    
    const categoryBefore = getCategory(wdlBeforeFromPlayerPerspective);
    const categoryAfter = getCategory(wdlAfterFromPlayerPerspective);
    
    console.log('  Category before:', categoryBefore);
    console.log('  Category after:', categoryAfter);
    
    // The problem: categoryAfter is 'loss' because wdlAfterFromPlayerPerspective = -2
    // But this is wrong! The position is still won for White.
    
    const moveQuality = getMoveQualityByTablebaseComparison(wdlBefore, wdlAfter, playerSide);
    
    console.log('  Result:', moveQuality.text);
    
    expect(categoryBefore).toBe('win');
    expect(categoryAfter).toBe('loss'); // This is the problem!
    expect(wdlAfterFromPlayerPerspective).toBe(-2); // White's perspective of -2 = loss
    
    // But actually, wdl = -2 after White's move means Black loses = White wins!
  });
  
  it('should understand the real meaning of WDL values', () => {
    // The key insight:
    // - Before White's move: It's White's turn, wdl = 2 means White wins
    // - After White's move: It's Black's turn, wdl = -2 means Black loses = White wins
    // 
    // The WDL value is ALWAYS from the perspective of whose turn it is!
    
    // So we should NOT convert the after-move WDL to the mover's perspective
    // because it's already from the opponent's perspective
    
    console.log('\nThe real problem:');
    console.log('- WDL values are from the perspective of whose TURN it is');
    console.log('- After White moves, it\'s Black\'s turn');
    console.log('- So wdl = -2 means Black loses = White still wins!');
    console.log('- The function incorrectly interprets this as White losing');
  });
});