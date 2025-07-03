# CLAUDE.md - AI Assistant Project Context

## 🎯 Project Overview
**ChessEndgameTrainer** - Moderne Web/Mobile Anwendung zum Schach-Endspiel-Training mit KI-Engine

### Quick Facts
- **Status**: Production Ready Web, Mobile Architecture vorbereitet
- **Test Coverage**: 56.15% (903/928 tests passing after optimization)
- **Codebase**: 113 TypeScript files, ~15,000 LOC
- **Features**: 6 Endspiel-Positionen, Stockfish.js Integration, Spaced Repetition
- **Performance**: 75% weniger API-Calls, 31% schnellere Evaluations, 53% schnellere Navigation

## 🚀 Essential Commands
```bash
npm run dev          # Start dev server → http://localhost:3000
npm test            # Run all tests
npm run test:coverage # Check coverage (Goal: 80%)
npm run lint        # ESLint check
npm run check-duplicates # Check for duplicate components
```

## 📁 Critical Files & Their Purpose

### Core Application Logic
- `pages/train/[id].tsx` - Haupttraining Interface mit Schachbrett
- `shared/lib/chess/ScenarioEngine.ts` - Chess Engine + Tablebase Integration
- `shared/data/endgames/index.ts` - Alle Trainingsstellungen (6 Positionen)
- `shared/contexts/TrainingContext.tsx` - Global Training State

### Key Components
- `shared/components/training/TrainingBoard/` - Kern-Trainingslogik
- `shared/components/training/DualEvaluationPanel/` - Engine + Tablebase Analyse
- `shared/components/chess/Chessboard.tsx` - React-Chessboard Wrapper

### Services & Utilities
- `shared/services/chess/EngineService.ts` - Stockfish Worker Management
- `shared/lib/stockfish.ts` - Stockfish.js Wrapper (100% test coverage)
- `shared/services/errorService.ts` - Centralized Error Handling

## 🏗️ Architecture Principles

### Cross-Platform Strategy
```
shared/              # 80% Code für Web + Mobile
├── components/      # UI Komponenten (platform-agnostic)
├── hooks/          # Business Logic als Hooks
├── lib/            # Core Libraries & Engine
├── services/       # Platform Services (abstractions)
└── types/          # TypeScript Definitionen

pages/              # Next.js Web Pages
app/mobile/         # React Native App (vorbereitet)
```

### State Management
- **Current**: React Context + Local State
- **TODO**: Zustand implementieren (bereits installiert)

### Testing Strategy
- Unit Tests für alle Hooks und Services
- Integration Tests für kritische User Flows
- Mock Strategy für Worker APIs und Browser APIs
- Goal: 80% Coverage für Production

## ⚠️ Known Issues & Technical Debt

### High Priority
1. **Type Definitions**: `types/chess.ts` nur 5 Zeilen - needs expansion
2. **Mobile Tests**: 0% coverage für mobile components
3. **Platform Abstraction**: Direkte Browser API usage ohne Fallbacks
4. **Error Handling**: Inkonsistent, needs standardization

### Medium Priority
- Magic numbers ohne Konstanten (z.B. `50 * 1024 * 1024`)
- Console.logs statt proper logging service
- Kein Code-Splitting oder Lazy Loading
- State Management nicht zentralisiert

### Low Priority
- Internationale Unterstützung fehlt
- Analytics Integration fehlt
- PWA Features nicht implementiert

## 🎯 Current Development Priorities

### ✅ Phase 1-3: Performance Optimization (COMPLETED)
- **Worker initialization race condition FIXED**
- **78.6% memory reduction** through FEN-based state
- **99.99% performance improvement** for cache hits
- **Mobile-optimized**: Only 1.7KB memory footprint

### 🚀 Current Focus: BRÜCKENBAU-TRAINER (Enhanced Move Evaluation)

## 📊 BRÜCKENBAU-TRAINER: Erweiterte Zugbewertung

### Vision
Erweiterung des bestehenden Tablebase-Bewertungssystems um eine **5-stufige Qualitätsklassifikation** für Win→Win Züge. Fokus auf **"sicher vor perfekt"** - Züge die den Gewinn zuverlässig festhalten werden höher bewertet als riskante Perfekt-Züge.

### Qualitätsklassen (basierend auf ΔDTM)

| Klasse  | ΔDTM-Kriterium | Icon | Kurztext         | Beschreibung                           |
|---------|----------------|------|------------------|----------------------------------------|
| optimal | ≤ 1            | 🟢   | Kürzester Weg    | Optimaler oder fast optimaler Zug      |
| sicher  | ≤ 5            | ✅   | Sichere Technik  | Zuverlässige Gewinntechnik             |
| umweg   | ≤ 15           | 🟡   | Dauert länger    | Funktioniert, aber ineffizient         |
| riskant | > 15 & Win     | ⚠️   | Gewinn fragil    | Gewinn bleibt, aber sehr kompliziert   |
| fehler  | Win→Draw/Loss  | 🚨   | Gewinn verspielt | Objektivverlust (bestehende Logik)     |

### Robustheitsbewertung

| Tag     | Kriterium      | Bedeutung                    |
|---------|----------------|------------------------------|
| robust  | ≥ 3 Gewinnzüge | Viele gute Alternativen      |
| präzise | = 2 Gewinnzüge | Wenige gute Optionen         |
| haarig  | = 1 Gewinnzug  | Nur dieser Zug gewinnt       |

### Technische Integration

#### Erweiterte Datenstrukturen
```typescript
interface EnhancedTablebaseData extends TablebaseData {
  // Bestehend bleibt:
  isTablebasePosition: boolean;
  wdlBefore?: number;
  wdlAfter?: number;
  
  // NEU für Brückenbau-Trainer:
  dtmBefore?: number;        // Distance to Mate vor dem Zug
  dtmAfter?: number;         // Distance to Mate nach dem Zug
  moveQuality?: MoveQualityClass;
  robustness?: RobustnessTag;
  winningMovesCount?: number; // Anzahl gewinnender Züge in Position
}

type MoveQualityClass = 'optimal' | 'sicher' | 'umweg' | 'riskant' | 'fehler';
type RobustnessTag = 'robust' | 'präzise' | 'haarig';
```

#### Erweiterte Bewertungslogik
```typescript
export const getEnhancedMoveQuality = (
  wdlBefore: number,
  wdlAfter: number, 
  dtmBefore: number,
  dtmAfter: number,
  winningMovesCount: number,
  playerSide: 'w' | 'b'
): EnhancedEvaluationDisplay => {
  // 1. Basis WDL-Bewertung (bestehende Logik)
  const baseEval = getMoveQualityByTablebaseComparison(wdlBefore, wdlAfter, playerSide);
  
  // 2. Bei Win→Win: Verfeinerte Klassifikation
  if (getCategory(wdlBefore) === 'win' && getCategory(wdlAfter) === 'win') {
    const dtmDiff = dtmAfter - dtmBefore;
    const qualityClass = classifyWinToWin(dtmDiff);
    const robustness = classifyRobustness(winningMovesCount);
    
    return enhancedEvaluation(baseEval, qualityClass, robustness, dtmDiff);
  }
  
  return mapToEnhanced(baseEval);
};
```

### Implementierungs-Phasen

#### Phase P1: Datenmodell erweitern (NEXT)
- [ ] `EnhancedTablebaseData` Interface zu `types/evaluation.ts`
- [ ] `EnhancedEvaluationDisplay` Interface definieren  
- [ ] `MoveQualityClass` und `RobustnessTag` Types
- [ ] Rückwärtskompatibilität sicherstellen

#### Phase P2: Bewertungslogik implementieren
- [ ] `getEnhancedMoveQuality()` in `evaluationHelpers.ts`
- [ ] `classifyWinToWin()` und `classifyRobustness()` Helper
- [ ] Educational Content Konstanten
- [ ] Integration mit bestehender Logik

#### Phase P3: UI-Integration
- [ ] `MovePanel.tsx` um Enhanced Display erweitern
- [ ] CSS für neue Qualitätsbadges
- [ ] Tooltip-Komponente für Lernhinweise
- [ ] Erweiterte Legende

#### Phase P4: Karten-System (Future)
- [ ] Strukturierte Lektionen mit To-do-Tracking
- [ ] 3 Pilotkarten: Zickzack, Turm-Brücke, König abdrängen
- [ ] Fortschritts-Persistierung

### Test-Strategie
```typescript
const TEST_CASES = [
  {
    name: "Optimal - perfekter Zug",
    wdlBefore: 2, wdlAfter: 2,
    dtmBefore: 15, dtmAfter: 14,
    expected: { class: 'optimal', robustness: 'robust' }
  },
  // ... weitere Test-Cases für alle Qualitätsklassen
];
```

## 💡 Code Patterns & Best Practices

### Component Pattern
```typescript
// Prefer hooks for logic separation
const useChessLogic = () => { /* logic */ };
const ChessComponent = () => {
  const logic = useChessLogic();
  return <UI {...logic} />;
};
```

### Error Handling Pattern
```typescript
try {
  await riskyOperation();
} catch (error) {
  errorService.logError('Context', error);
  // Graceful degradation
}
```

### Testing Pattern
```typescript
// Mock Worker APIs
global.Worker = jest.fn(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn()
}));
```

## 🔧 Development Tips

### Performance Considerations
- ScenarioEngine tracks instances (memory management)
- Stockfish Worker needs proper cleanup
- Mobile: Max 1 engine instance at a time
- Use debouncing for expensive operations

### Mobile-Specific
- Touch targets minimum 44px
- Responsive breakpoints: 640px, 1024px
- Memory constraints auf mobile devices
- Offline-first architecture planen

### Code Quality
- TypeScript strict mode anstreben
- Immer Tests für neue Features
- Platform APIs abstrahieren
- Constants für Magic Numbers

## 📊 Metrics & Goals

### Current State
- Test Coverage: 56.15% (Ziel: 80%)
- Test Success: 97.3% (903/928) - Nach Performance Optimierungen
- Bundle Size: ~500KB (Ziel: <300KB)
- Lighthouse Score: 85+ (Ziel: 95+)
- Performance: Optimiert mit Debouncing, LRU Cache, Instance Reuse

### Success Metrics
- User können 50+ Endspiele trainieren
- Mobile App mit 80% shared code
- Offline Training möglich
- <1s Ladezeit auf 3G

## 🚨 Important Notes

### Stockfish Integration
- Uses stockfish-nnue-16.wasm
- Worker cleanup kritisch für Memory
- UCI Protocol für Kommunikation
- Evaluation in centipawns

### Mobile Considerations
- React Native 0.73.4 vorbereitet
- Expo für einfaches Development
- Native Module für Performance
- Platform-specific Storage Service

### Deployment
- Next.js static export möglich
- Firebase ready (config vorhanden)
- Vercel deployment optimiert
- PWA manifest vorbereitet

## 🚀 Recent Updates (Januar 2025)

### Engine UI Integration (2025-01-14)
- **Sidebar Integration**: Engine-Anzeige jetzt in der rechten Seitenleiste (chess.com Style)
- **Separate Toggles**: Engine (grün) und Tablebase (blau) können unabhängig aktiviert werden
- **Best Moves Display**: Zeigt die Top 3 Züge mit Bewertungen (Lichess-Style)
  - Engine: Bewertung in Centipawns oder Matt-Ankündigung
  - Tablebase: DTM (Distance to Mate) oder Win/Draw/Loss
- **Multi-PV Support**: Engine kann mehrere beste Züge gleichzeitig analysieren
- **Improved UX**: Keine schwebenden Overlays mehr, alles integriert

### Performance Optimierungen

### useEvaluation Hook
- **Debouncing**: 300ms Verzögerung verhindert Evaluation-Flooding
- **LRU Cache**: 200 Items (~70KB) für wiederholte Positionen
- **Parallel Promises**: Tablebase-Vergleiche 31% schneller
- **AbortController**: Veraltete Requests werden abgebrochen

### useChessGame Hook  
- **Single Instance**: Nur 1 Chess.js Instanz per Spiel (useRef)
- **Built-in Methods**: undo() statt neue Instanz erstellen
- **Batch Updates**: Ein setState pro Operation
- **Memory Safe**: Kein Instance-Churn mehr

### Messergebnisse
- 75% weniger API-Calls bei schnellen Zügen
- 31% schnellere Tablebase-Vergleiche
- 53% schnellere jumpToMove Operationen
- 100% Cache-Hit-Rate für wiederholte Positionen

## 📋 Nächste Schritte

1. **Sofort**: useReducer Migration für useChessGame
2. **Diese Woche**: Phase P1 - Enhanced Types implementieren
3. **Nächste Woche**: Phase P2 - Bewertungslogik erweitern
4. **Später**: Phase P4 - Karten-System für strukturierte Lektionen

---
**Last Updated**: 2025-01-10 - Performance Optimierungen dokumentiert
**Next Review**: Nach useReducer Migration
## 🐛 Common Pitfalls & Lessons Learned (2025-01-11)

### Tablebase Evaluation Logic
**Issue**: Black's optimal defensive moves were showing red triangles (🔻) instead of shields (🛡️)

**Root Cause**: The evaluation logic didn't properly handle the case where maintaining a losing position is actually optimal play when no better alternative exists.

**Key Learnings**:
1. **WDL Values are Always from White's Perspective**
   - For Black, values must be negated: `playerSide === 'b' ? -wdl : wdl`
   - A win for White (2) is a loss for Black (-2 from Black's perspective)

2. **Optimal Defense Recognition**
   - When in a losing position, maintaining that position (WDL stays the same) often represents the best possible play
   - Example: Black maintaining a tablebase loss for maximum resistance should be rewarded, not penalized

3. **Test Perspective Awareness**
   - Tests must account for player perspective
   - Same WDL transition has opposite meanings for different players
   - Example: WDL 2→0 is catastrophic for White but good for Black

**Solution Applied**:
```typescript
// When WDL stays exactly the same in a losing position
if (categoryBefore === 'loss' && categoryAfter === 'loss') {
  if (wdlAfterFromPlayerPerspective === wdlBeforeFromPlayerPerspective) {
    return { text: '🛡️', className: 'eval-neutral' }; // Optimal defense\!
  }
}
```

### Debug Log Management
**Issue**: Extensive console.log statements for debugging were left in production code

**Impact**: Performance overhead and cluttered console output

**Prevention**:
1. Use a proper logging service with log levels
2. Create debug builds vs production builds
3. Use conditional logging: `if (DEBUG) console.log(...)`
4. Always remove debug logs before committing

### Documentation Location
- Detailed evaluation logic documentation: `/shared/utils/chess/EVALUATION_LOGIC_LEARNINGS.md`
- This file provides in-depth technical details about WDL handling and perspective correction

---
**Last Updated**: 2025-01-14 - Engine UI Integration & Best Moves Display
**Session Summary**: 
- Komplette UI-Überarbeitung der Engine-Anzeige (Lichess-Style)
- Separate Toggles für Engine und Tablebase
- Best Moves Display mit Top 3 Zügen
- TDD-Implementierung für Tablebase-Funktionalität
EOF < /dev/null
