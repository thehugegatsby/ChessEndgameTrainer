# TablebaseService Documentation

**Purpose**: LLM-optimized reference for tablebase integration
**Last Updated**: 2025-07-31
**Architecture Version**: 2.0 (Simplified)

## 🎯 Overview

Direct Lichess tablebase API integration for 7-piece endgame positions.

## 📊 Architecture

```
AnalysisService
     ↓
TablebaseService → Lichess API (https://tablebase.lichess.ovh)
     ↓
LRU Cache (200 positions)
```

## 🔑 Key Components

### TablebaseService (`/shared/services/TablebaseService.ts`)

```typescript
class TablebaseService {
  // Main evaluation method
  async getEvaluation(fen: string): Promise<TablebaseEvaluationResult>;

  // Get top moves with DTZ/DTM
  async getTopMoves(fen: string, count: number): Promise<TablebaseMovesResult>;

  // Check if position qualifies for tablebase
  isTablebasePosition(fen: string): boolean;
}
```

### Key Interfaces

```typescript
interface TablebaseEvaluationResult {
  isAvailable: boolean;
  result: {
    wdl: number; // Win/Draw/Loss: 2=win, 0=draw, -2=loss
    dtz: number | null; // Distance to Zero
    dtm: number | null; // Distance to Mate
    category: 'win' | 'cursed-win' | 'draw' | 'blessed-loss' | 'loss';
  } | null;
  error?: string;
}

interface TablebaseMovesResult {
  isAvailable: boolean;
  moves: Array<{
    uci: string;
    san: string;
    wdl: number;
    dtz: number | null;
    dtm: number | null;
    category: string;
  }> | null;
}
```

## 🚀 Usage

### In AnalysisService

```typescript
// Check tablebase first for endgames
const tablebaseResult = await tablebaseService.getEvaluation(fen);
if (tablebaseResult.isAvailable && tablebaseResult.result) {
  // Use tablebase data
  return formatTablebaseResult(tablebaseResult);
}
// Fall back to engine...
```

### Getting Best Move

```typescript
const topMoves = await tablebaseService.getTopMoves(fen, 1);
if (topMoves.isAvailable && topMoves.moves?.length > 0) {
  return topMoves.moves[0].san; // Best tablebase move
}
```

## ⚡ Performance

- **Cache**: LRU with 200 position limit
- **Network**: ~50-200ms per API call
- **Piece Limit**: Max 7 pieces (including kings)
- **Rate Limiting**: Lichess fair use policy

## 🔧 Configuration

```typescript
const TABLEBASE_CONFIG = {
  API_URL: 'https://tablebase.lichess.ovh/standard',
  MAX_PIECES: 7,
  CACHE_SIZE: 200,
  TIMEOUT: 5000,
};
```

## 🧪 Testing

```typescript
// Mock tablebase responses
jest.mock('@shared/services/TablebaseService', () => ({
  tablebaseService: {
    getEvaluation: jest.fn().mockResolvedValue({
      isAvailable: true,
      result: { wdl: 2, dtz: 5, category: 'win' },
    }),
  },
}));
```

## 📝 WDL Values

- `2`: Clear win
- `1`: Cursed win (win under 50-move rule)
- `0`: Draw
- `-1`: Blessed loss (draw under 50-move rule)
- `-2`: Clear loss

## 🚨 Error Handling

```typescript
try {
  const result = await tablebaseService.getEvaluation(fen);
  if (!result.isAvailable) {
    // Not a tablebase position or API unavailable
    return null;
  }
} catch (error) {
  // Network error or invalid FEN
  logger.warn('Tablebase lookup failed', error);
  return null;
}
```

## 📊 Metrics

- **Coverage**: All 7-piece endgames
- **Accuracy**: 100% (perfect play database)
- **Availability**: ~99.9% (Lichess uptime)
- **Cache Hit Rate**: ~60-80% in typical usage
