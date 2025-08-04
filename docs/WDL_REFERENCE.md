# WDL (Win/Draw/Loss) Reference Guide

## Overview

The Lichess Tablebase API uses a 5-value WDL system to represent the theoretical outcome of chess positions with perfect play from both sides.

## WDL Values

All WDL values are from **White's perspective**:

| Value  | Category     | Meaning                                                     | Example                   |
| ------ | ------------ | ----------------------------------------------------------- | ------------------------- |
| **+2** | Win          | White wins with perfect play                                | K+Q vs K endgame          |
| **+1** | Cursed-win   | White wins, but position would be drawn under 50-move rule  | Some complex endgames     |
| **0**  | Draw         | Position is theoretically drawn                             | K vs K, most K+B vs K     |
| **-1** | Blessed-loss | White loses, but position would be drawn under 50-move rule | Rare defensive fortresses |
| **-2** | Loss         | White loses with perfect play                               | K vs K+Q endgame          |

### For Black's Perspective

To get WDL from Black's perspective, simply **negate** the value:

- White win (+2) → Black loss (-2)
- White cursed-win (+1) → Black blessed-loss (-1)
- Draw (0) → Draw (0)
- White blessed-loss (-1) → Black cursed-win (+1)
- White loss (-2) → Black win (+2)

## DTZ vs DTM

### DTZ (Distance to Zeroing)

- Counts moves until the 50-move counter resets (pawn move or capture)
- More commonly available in tablebases
- Can be misleading for resistance calculation

### DTM (Distance to Mate)

- Counts total moves until checkmate with perfect play
- More accurate for determining resistance in lost positions
- Not always available in tablebase data

## Usage in Code

```typescript
// Example: Interpreting tablebase results
const result = await tablebaseService.getEvaluation(fen);
if (result.isAvailable && result.result) {
  switch (result.result.wdl) {
    case 2:
      console.log("White is winning");
      break;
    case 1:
      console.log("White wins (cursed - watch 50-move rule)");
      break;
    case 0:
      console.log("Position is drawn");
      break;
    case -1:
      console.log("White loses (blessed - can draw with 50-move rule)");
      break;
    case -2:
      console.log("White is losing");
      break;
  }
}
```

## Move Selection Strategies

### Best Defense (Longest Resistance)

For losing positions, the `MoveStrategyService` prioritizes:

1. **DTM** (when available) - actual moves to mate
2. **DTZ** (fallback) - moves to pawn/capture

This ensures the defender makes it as difficult as possible for the attacker.

### Perfect Play

For winning positions, choose moves with:

- Highest WDL value first
- Lowest DTZ/DTM (fastest win)

## Common Pitfalls

1. **Forgetting perspective**: Always check if WDL is from White or Black's view
2. **DTZ vs DTM confusion**: DTZ ≠ moves to mate
3. **Cursed/Blessed positions**: These require careful handling of 50-move rule

## See Also

- [TablebaseService Documentation](./shared/services/tablebase/README.md)
- [Lichess Tablebase API](https://lichess.org/blog/W3WeMyQAACQAdfAL/7-piece-syzygy-tablebases-are-complete)
- [Syzygy Tablebases](https://syzygy-tables.info/)
