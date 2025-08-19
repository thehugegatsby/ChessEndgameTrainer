# Kf8 Automatik Bug - Debugging Session

## Problem
Nach dem Zug Kf6 (weiß) wird der automatische Gegenzug Kf8 (schwarz) **nicht** gespielt, obwohl predefined move sequences implementiert sind.

## Status
- ✅ E2E Tests zeigen dass Kf6 UND Kf8 beide gespielt werden
- ❌ In manuellen Tests wird Kf8 nicht automatisch gespielt
- ✅ Navigation zu Position 2 funktioniert
- ✅ Predefined move sequences sind implementiert

## Aktuelle Implementierung

### TrainingSession.ts
```typescript
export interface TrainingConfig {
  // ... existing fields
  /** Predefined move sequence for training (alternating white/black) */
  moveSequence?: string[];
}

private moveIndex: number = 0; // Track current position in move sequence

getNextSequenceMove(): string | null {
  if (!this.hasNextSequenceMove()) return null;
  return this.config.moveSequence![this.moveIndex];
}
```

### useSimpleChess.ts
```typescript
// Schedule engine move if needed
if (trainingSession && 'shouldScheduleEngine' in result && result.shouldScheduleEngine) {
  const nextMove = trainingSession.getNextSequenceMove();
  if (nextMove) {
    console.log('🤖 Scheduling predefined engine move:', nextMove);
    setTimeout(() => {
      makeEngineMove(nextMove);
    }, 500);
  }
}
```

## Tests vs Realität

### E2E Test (funktioniert)
- Benutzt `WIN_SEQUENCE_MOVES = ['e6f6', 'e8f8', ...]`
- Beide Züge werden gespielt
- Test läuft durch

### Manual Test (funktioniert nicht)
- Position 1 lädt: "King and Pawn vs King - Basic Win"
- FEN: `4k3/8/4K3/4P3/8/8/8/8 w - - 0 1`
- Kf6 wird gemacht ✅
- Kf8 wird NICHT automatisch gespielt ❌

## Hypothesen

### H1: Position 1 hat keine moveSequence
Die echte Position 1 hat möglicherweise keine predefined move sequence in der Konfiguration.

### H2: TrainingSession wird nicht richtig initialisiert
Die TrainingSession für Position 1 hat keine moveSequence.

### H3: shouldScheduleEngine wird nicht gesetzt
Der `shouldScheduleEngine` flag wird nicht richtig von TrainingSession zurückgegeben.

## Debug Console Messages (Manual Test)

Beim Zug Kf6:
```
🎯 E2E DEBUG: onSquareClick called {square: e6, ...}
🎯 [MOVE CHAIN] onSquareClick: Selected square e6
🚀 [MOVE CHAIN] onDrop: Calling handleMove
🔄 [MOVE CHAIN] handleMove called in useMoveHandlers
🚀 [MOVE CHAIN] Calling onMove (makeMove) from handleMove
✅ [MOVE CHAIN] onMove (makeMove) returned {result: false, ...}
```

**Wichtig**: `result: false` bedeutet der Zug war nicht erfolgreich!

## Debugging Steps

1. **Position 1 Konfiguration prüfen**
   - Wo wird Position 1 definiert?
   - Hat sie eine moveSequence?

2. **TrainingSession Debug**
   - Console.log in TrainingSession.getNextSequenceMove()
   - Console.log moveSequence bei Initialisierung

3. **useSimpleChess Debug**
   - Console.log shouldScheduleEngine flag
   - Console.log result von TrainingSession

4. **Move Validation**
   - Warum returnt makeMove `result: false`?
   - Ist Kf6 ein valider Zug in dieser Position?

## Nächste Schritte

1. Position 1 Konfiguration finden und moveSequence hinzufügen
2. Debug logs hinzufügen um zu sehen warum moves fehlschlagen
3. Manual test mit korrekter moveSequence wiederholen

## Files zu untersuchen

- `src/shared/services/database/positions/` - Position Definitionen
- `src/shared/testing/ChessTestData.ts` - Test Positionen (funktionieren)
- `src/domains/training/TrainingSession.ts` - Move sequence logic
- `src/shared/hooks/useSimpleChess.ts` - Auto move scheduling

## Session State
- Dev server läuft auf :3002
- Position 1 geladen
- Weißer König auf e6, schwarzer König auf e8, weißer Bauer auf e5
- Bereit für Kf6 → Kf8 Test