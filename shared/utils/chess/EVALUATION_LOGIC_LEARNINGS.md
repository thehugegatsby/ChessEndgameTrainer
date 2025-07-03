# Chess Evaluation Logic Learnings

## Overview
This document captures important learnings about the chess evaluation logic, particularly regarding WDL (Win/Draw/Loss) values and player perspective handling.

## Key Concepts

### 1. WDL Values and Perspective
- **CRITICAL**: WDL values in tablebase results are ALWAYS from White's perspective
- Values: 2=win, 1=cursed-win, 0=draw, -1=blessed-loss, -2=loss
- For Black's perspective, these values must be negated

### 2. Optimal Defense in Losing Positions
- **Learning**: When a player is in a losing position (e.g., WDL = -2), maintaining that position is often the BEST possible play
- **Example**: Black in a tablebase loss maintaining the longest resistance
- **Fix Applied**: Changed logic to show 🛡️ (optimal defense) instead of 🔻 (weak defense) when WDL remains the same in a losing position

### 3. Move Quality Evaluation Logic
The `getMoveQualityByTablebaseComparison` function evaluates moves based on WDL transitions:

```typescript
// Perspective correction is crucial:
const wdlBeforeFromPlayerPerspective = playerSide === 'w' ? wdlBefore : -wdlBefore;
const wdlAfterFromPlayerPerspective = playerSide === 'w' ? wdlAfter : -wdlAfter;
```

#### Categories:
1. **Catastrophic (🚨/💥)**: Throwing away wins or draws
2. **Mistakes (❌)**: Worsening position significantly  
3. **Excellent (✅/🌟/🎯)**: Maintaining or improving winning positions
4. **Good (👍)**: Improving from bad positions
5. **Defensive (🛡️)**: Optimal play in losing positions
6. **Weak Defense (🔻)**: Making a losing position worse

## Common Mistakes to Avoid

### 1. Assuming WDL Values are Absolute
**Mistake**: Treating WDL values as if they apply equally to both players
**Correct**: Always consider player perspective - a win for White (2) is a loss for Black

### 2. Penalizing Optimal Defense
**Mistake**: Marking moves as "weak" when they maintain a losing position
**Correct**: Recognize that maintaining the best possible resistance in a lost position IS optimal play

### 3. Incorrect Test Expectations
**Mistake**: Writing tests that expect the same evaluation for both colors with the same WDL transition
**Example**: `getMoveQualityByTablebaseComparison(2, 0, 'w')` vs `getMoveQualityByTablebaseComparison(2, 0, 'b')`
- White: Throwing away a win (catastrophic)
- Black: Opponent's win becomes draw (good for Black)

### 4. DTZ vs DTM Confusion
**Current State**: We use DTZ (Distance to Zeroing) from tablebase
**Future Enhancement**: DTM (Distance to Mate) would provide more precise evaluation for the Brückenbau-Trainer feature

## Implementation Details

### Defensive Move Logic
```typescript
// DEFENSIVE: Best try in losing position
if (categoryBefore === 'loss' && categoryAfter === 'loss') {
  // Improved defense
  if (wdlAfterFromPlayerPerspective > wdlBeforeFromPlayerPerspective) {
    return { text: '🛡️', className: 'eval-neutral' };
  }
  // Made position worse
  if (wdlAfterFromPlayerPerspective < wdlBeforeFromPlayerPerspective) {
    return { text: '🔻', className: 'eval-inaccurate' };
  }
  // Maintained position - this is optimal defense!
  return { text: '🛡️', className: 'eval-neutral' };
}
```

## Testing Considerations

When writing tests for evaluation logic:
1. Always specify the player side ('w' or 'b')
2. Think from that player's perspective
3. Remember that optimal play in a losing position should be rewarded, not penalized
4. Test both sides to ensure perspective handling is correct

## Future Improvements

1. **DTM Integration**: When available, use Distance to Mate for more precise evaluation
2. **Robustness Indicators**: Show how many good moves were available
3. **Educational Tips**: Provide context-specific learning hints based on move quality