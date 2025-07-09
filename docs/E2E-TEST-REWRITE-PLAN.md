# E2E Test Infrastructure Complete Rewrite Plan

## 🎯 Ziel
Komplette Neuentwicklung der E2E Test-Infrastruktur mit der "saubersten und besten Lösung, egal wieviel Aufwand" - wie vom User explizit gewünscht.

## 📋 Hintergrund

### Aktuelle Probleme
- Tests erwarten `window.__testApi`, welches in der neuen DI-Architektur nicht mehr existiert
- Fehler: "Test API not available" in allen E2E Tests
- Architektur-Mismatch zwischen alter Test-API und neuer DI-basierter MockEngineService
- Tests benötigen 10+ Sekunden pro Engine-Response ohne Mocking

### AI-Konsens aus Diskussionen

**Gemini 2.5 Pro (FOR stance):**
- Empfiehlt "Hybrid Control Plane Model"
- Test Bridge nur für Mock-Konfiguration, keine App-Logik
- Playwright definitiv bevorzugen
- Strangler Fig Migration Pattern
- Confidence: 9/10

**OpenAI O3-mini (NEUTRAL stance):**
- Stimmt Control Plane zu, aber mit Kompromissen
- Read-only diagnostic viewport für komplexe Assertions
- Warnt vor zu restriktivem "no state getters"
- Parallelbetrieb während Migration wichtig
- Confidence: 9/10

**Konsens-Entscheidung:**
Hybrid Control Plane Model mit minimaler Test Bridge, die später um read-only Diagnostic API erweitert werden kann.

## 🏗️ Architektur-Übersicht

```
[Playwright Tests]
        |
        | 1. Configure Mocks via page.evaluate()
        v
[Browser: window.__E2E_TEST_BRIDGE__]
        |
        | 2. Bridge.configure(key, value)
        v
[DI Container] --> [MockEngineService]
        |
        | 3. App responds with mocked data
        v
[UI Updates] <-- 4. Tests observe UI changes
```

## 📝 Implementierungsplan

### Phase 1: Test Bridge Foundation (Priorität: HIGH)

#### 1.1 Analyse des bestehenden DI-Containers und MockEngineService ✅
- **Ziel:** Verstehen wie MockEngineService in DI integriert ist
- **Warum:** Basis für saubere Bridge-Integration
- **Deliverable:** Dokumentation der DI-Struktur

**Ergebnis der Analyse:**
- React Context (`EngineContext`) fungiert als DI-Container
- `EngineProvider` ist der Composition Root
- MockEngineService wird bei `window.__engineService` registriert (nur in Tests)
- Body-Attribut `data-engine-status` für E2E Synchronisation

**AI-Konsens:**
- Gemini: Direkter Zugriff auf `window.__engineService` empfohlen (pragmatisch)
- O3: Stimmt zu, warnt aber vor Race Conditions und empfiehlt Type Safety

#### 1.2 Design der minimalen Test Bridge API ✅
- **Ziel:** Minimale API-Oberfläche definieren
- **Warum:** "Start small, think big" - Gemini's Empfehlung
- **Deliverable:** TypeScript Interface für Bridge

**Ergebnis der AI-Consensus Diskussion:**

**Übereinstimmung aller 4 Modelle:**
- ✅ Types in shared/ Ordner (kein separates Package)
- ✅ Explizite API-Methoden (setNextMove vs configure)
- ✅ __E2E_TEST_BRIDGE__ als Namespace
- ✅ waitForReady() als pragmatischer Start

**Finales Design:**
```typescript
// shared/types/test-bridge.d.ts
interface TestBridgeEngineAPI {
  setNextMove: (fen: string, move: string) => void;
  setEvaluation: (fen: string, evaluation: number) => void;
  addCustomResponse: (fen: string, analysis: EngineAnalysis) => void;
  clearCustomResponses: () => void;
  reset: () => void;
}

interface TestBridge {
  engine: TestBridgeEngineAPI;
  diagnostic?: TestBridgeDiagnosticAPI; // Optional für später
  waitForReady: (timeout?: number) => Promise<void>;
}
```

**Wichtige Verbesserungen aus Consensus:**
1. **waitForReady() mit Timeout** (von Haiku vorgeschlagen)
2. **Event-System als langfristige Evolution** (alle Modelle)
3. **Error Handling:** throw für kritische Fehler (Mehrheit)
4. **Logging-Strategie** für Debugging (Haiku)

**Confidence Scores:** 9/10, 9/10, 8/10, 8/10 - sehr hohe Zustimmung

#### 1.3 Implementierung der Test Bridge mit configure(key, value) ✅
- **Ziel:** Einfache configure() Methode implementieren
- **Warum:** Sauberster Ansatz für Mock-Konfiguration
- **Deliverable:** Funktionsfähige Test Bridge

**Ergebnis:**
- Implementiert mit expliziten API-Methoden statt generischem configure()
- HTTP-Header-basierte Lösung für SSR/CSR-Synchronisation
- Alle 4 Verbesserungen von Gemini/O3 umgesetzt:
  1. getInitialProps Trade-off dokumentiert
  2. __engineService global entfernt
  3. data-bridge-status Attribut hinzugefügt
  4. useEngineStatus Hook korrigiert
- Alle 8 Test Bridge Verification Tests bestehen

#### 1.4 Integration der Test Bridge in den DI-Container ✅
- **Ziel:** Bridge mit DI-Container verbinden
- **Warum:** Zugriff auf MockEngineService ermöglichen
- **Deliverable:** Bridge kann Mocks konfigurieren

**Ergebnis:** Bereits in Step 1.3 durch EngineContext Integration erreicht

#### 1.5 Erstellen eines Test-Build-Flags ✅
- **Ziel:** Bridge nur in Test-Builds laden
- **Warum:** Zero production overhead
- **Deliverable:** Conditional loading implementiert

**Ergebnis:** Durch HTTP-Header + Dynamic Import Lösung übertroffen

### Phase 2: Component Object Model Layer (Priorität: HIGH)

**Architektur-Entscheidung:** Component Object Model (COM) statt Page Object Model (POM)
- Bessere Wiederverwendbarkeit für zukünftige Features
- Spiegelt React-Komponenten-Struktur wider
- Confidence: 9/10 (Gemini & O3 Konsens)

#### 2.1 Test Data Builders erstellen ✅
- **Ziel:** Flexible, lesbare Test-Daten-Erstellung
- **Deliverables:**
  - `GameStateBuilder.ts` - Spielzustände aufbauen ✅
  - `PositionBuilder.ts` - Schachpositionen definieren ✅
  - `TrainingSessionBuilder.ts` - Trainingssitzungen konfigurieren ✅
  - `BaseBuilder.ts` - Immutable Builder Pattern ✅
  - `types.ts` - Branded Types für Type Safety ✅
  - `index.ts` - Convenience Factory Functions ✅
  - `builders.test.ts` - Comprehensive Test Coverage ✅
- **Implementiert:** 
  ```typescript
  // Zwei-Schichten-API mit Factory Functions
  const gameState = aGameState()
    .withFen('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1')
    .afterMoves(['Kf6', 'Kf7'])
    .withMockEngineResponse({ bestMove: 'Kf7', evaluation: 123 })
    .build();
  ```
- **Konsens-Bewertung:** Gemini 2.5 Pro & O3-Mini beide 9/10 Confidence
- **Status:** Vollständig implementiert, bereit für Phase 2.2

#### 2.2 Board Component Object erstellen ✅
- **Ziel:** Wiederverwendbare Schachbrett-Abstraktion
- **Features:**
  - `makeMove(from: string, to: string): Promise<void>` ✅
  - `getPieceAt(square: string): Promise<Piece | null>` ✅
  - `waitForPosition(fen: string): Promise<void>` ✅
  - `getHighlightedSquares(): Promise<string[]>` ✅
  - `loadPosition(position: Position): Promise<void>` ✅
  - `isMoveValid(from: string, to: string): Promise<boolean>` ✅
- **Implementiert:**
  - **BaseComponent (Hybrid-Ansatz)** - Abstract class + flexible constructor ✅
  - **BoardComponent** - Click-to-Click moves, FEN-polling, Test Data Builders Integration ✅
  - **TrainingBoardZustand Integration** - customSquareRenderer (Option B) ✅
  - **Hybrid Selector-Strategie** - `[data-square="e4"]` primary, `[data-testid="chess-square-e4"]` fallback ✅
  - **Data-Attributes** - `data-square`, `data-testid`, `data-piece`, `data-fen` ✅
  - **Comprehensive Test Suite** - ~15 test cases, Mock DOM, Edge Cases ✅
- **Konsens-Bewertung:** Gemini 2.5 Pro & O3-Mini beide 9/10 Confidence
- **Status:** Architektonisch exzellent, production-ready, future-proof
- **Deliverable:** `components/BaseComponent.ts`, `components/BoardComponent.ts` ✅

#### 2.3 MoveList Component Object erstellen ✅
- **Ziel:** Zuglisten-Interaktionen abstrahieren
- **Features:**
  - `getMoves(): Promise<Move[]>` ✅
  - `getLastMove(): Promise<Move | null>` ✅
  - `clickMove(moveNumber: number): Promise<void>` ✅
  - `waitForMoveCount(count: number): Promise<void>` ✅
  - `waitForMove(san: string): Promise<void>` ✅
  - `getActiveMove(): Promise<Move | null>` ✅
  - `goToFirstMove(): Promise<void>` ✅
  - `goToLastMove(): Promise<void>` ✅
  - `isEmpty(): Promise<boolean>` ✅
- **Architektonische Verbesserungen:**
  - **Hybrid Selector Strategy** - Priorisierte Fallbacks für maximale Robustheit ✅
  - **Environment-spezifische Timeout-Profile** - development/testing/ci ✅
  - **Strukturiertes Logging** - Context-aware Logger Service Integration ✅
  - **Konstanten-Zentralisierung** - Eliminiert alle Magic Numbers ✅
  - **Exponential Backoff** - Deterministisches Polling statt setTimeout ✅
  - **Optimierte Performance** - Caching und intelligente Fallback-Strategien ✅
- **Implementiert:**
  - **MoveListComponent** - Vollständige Zuglisten-Abstraktion ✅
  - **constants.ts** - Zentrale Konfiguration aller Timeouts, Selectors, Performance-Parameter ✅
  - **Logger Integration** - Structured logging mit getLogger().setContext() ✅
  - **Comprehensive Test Suite** - 68 Tests (10 Kategorien), Mock DOM, Performance Tests ✅
- **Konsens-Bewertung:** Gemini 2.5 Pro & O3-Mini beide 9/10 Confidence 
- **Status:** Architektonisch exzellent, "significant leap in architectural maturity"
- **Deliverables:** `components/MoveListComponent.ts`, `config/constants.ts`, `MoveListComponent.test.ts` ✅

#### 2.4 EvaluationPanel Component Object erstellen
- **Ziel:** Engine-Bewertungs-UI abstrahieren
- **Features:**
  - `getEvaluation(): Promise<number>`
  - `getBestMove(): Promise<string>`
  - `getDepth(): Promise<number>`
  - `waitForEvaluation(): Promise<void>`
  - `isThinking(): Promise<boolean>`
- **Selector-Strategie:** data-testid="evaluation-panel"
- **Deliverable:** `components/EvaluationPanel.ts`

#### 2.5 NavigationControls Component Object erstellen
- **Ziel:** Navigations-Buttons abstrahieren
- **Features:**
  - `goToStart(): Promise<void>`
  - `goBack(): Promise<void>`
  - `goForward(): Promise<void>`
  - `goToEnd(): Promise<void>`
  - `isBackEnabled(): Promise<boolean>`
- **Selector-Strategie:** role="button" + aria-label
- **Deliverable:** `components/NavigationControls.ts`

#### 2.6 AppDriver als Orchestrator implementieren
- **Ziel:** Zentrale Fassade für alle Components
- **Features:**
  - Lazy Loading der Components
  - Kombinierte Aktionen (z.B. makeMove + waitForEngine)
  - Test Bridge Integration
  - Helper für komplexe Szenarien
- **Async-Handling:** 
  - Primary: `page.waitForResponse()` mit MockEngineService
  - Fallback: Event-basiert für UI-Updates
- **Deliverable:** `AppDriver.ts`

#### 2.7 Base Component Klasse erstellen
- **Ziel:** Gemeinsame Funktionalität für alle Components
- **Features:**
  - Selector-Helper mit Prioritäten-Logik
  - Error Handling und Retry-Mechanismen
  - Logging-Integration
  - Wait-Helper für verschiedene Conditions
- **Deliverable:** `components/BaseComponent.ts`

#### 2.8 Playwright Test-Fixtures implementieren
- **Ziel:** Wiederverwendbare Test-Setups mit Builders
- **Beispiele:**
  - `withEmptyBoard` - Leeres Schachbrett
  - `withOppositionPosition` - König-Opposition
  - `withBridgeBuildingPosition` - Brückenbau-Szenario
  - `withCustomPosition(builder)` - Flexible Positionen
- **Integration:** Test Bridge automatisch konfiguriert
- **Deliverable:** `fixtures/index.ts`

### Phase 3: Neues Test-Framework (Priorität: MEDIUM)

#### 3.1 Setup des neuen Playwright Test-Verzeichnisses
- **Ziel:** tests-e2e-new/ Struktur erstellen
- **Warum:** Parallelbetrieb mit alten Tests
- **Deliverable:** Neue Verzeichnisstruktur

#### 3.2 Konfiguration von TypeScript Type Sharing
- **Ziel:** Gemeinsame Types zwischen App und Tests
- **Warum:** Type-Safety über Grenzen hinweg
- **Deliverable:** Shared types config

#### 3.3 Schreiben des ersten kritischen Smoke-Tests
- **Ziel:** Proof of Concept für neue Architektur
- **Test:** Basic training flow (make move, engine responds)
- **Deliverable:** Funktionierender Test

#### 3.4 CI/CD Pipeline für parallelen Betrieb
- **Ziel:** Alte und neue Tests parallel laufen lassen
- **Warum:** Risikominimierung während Migration
- **Deliverable:** CI config update

### Phase 4: Diagnostic API (Priorität: LOW)

#### 4.1 Design der read-only Diagnostic API
- **Ziel:** Architektur für Zustandszugriff planen
- **Warum:** O3's Kompromiss für komplexe Assertions
- **Deliverable:** API Design Dokument

#### 4.2 Implementierung der Diagnostic API
- **Ziel:** Serialisierte, read-only Zustandsdaten
- **Einschränkung:** Keine Aktionen, nur Lesen
- **Deliverable:** getDiagnostics() Methode

#### 4.3 Erstellen von Polling-Helper Utilities
- **Ziel:** Helper für Zustandsänderungen
- **Beispiel:** waitForState(predicate, timeout)
- **Deliverable:** test-utils.ts

### Phase 5: Migration & Cleanup (Priorität: LOW)

#### 5.1 Migration der 5 kritischsten User Journeys
- **Tests:** 
  1. Basic Training Flow
  2. Navigation zwischen Positionen
  3. Move Validation
  4. URL Parameters
  5. Engine Integration
- **Deliverable:** 5 stabile Tests

#### 5.2 Erstellen eines Fortschritts-Dashboards
- **Ziel:** Migrations-Fortschritt visualisieren
- **Metriken:** Tests migriert, Coverage, Stabilität
- **Deliverable:** Dashboard oder Report

#### 5.3 Schrittweise Migration aller Tests
- **Ziel:** Alle ~17 Tests zur neuen Architektur
- **Methode:** Sprint-by-sprint Migration
- **Deliverable:** Vollständige Test-Suite

#### 5.4 Deprecation der alten Test-Infrastruktur
- **Ziel:** Alten Code entfernen
- **Bedingung:** Neue Suite 100% stabil
- **Deliverable:** Cleanup durchgeführt

## 🔧 Technische Entscheidungen

### Playwright vs Cypress
**Entscheidung:** Playwright
- Out-of-process Architektur ideal für Control Plane
- Bessere TypeScript-Unterstützung
- Superior debugging (Trace Viewer)
- Parallel execution support

### TypeScript Type Sharing
**Ansatz:** Shared @types package oder tsconfig paths
- Verhindert Type-Drift
- Compile-time safety
- Self-documenting tests

### Test Bridge Prinzipien
1. **Minimal Surface Area:** Nur configure(), keine App-Logik
2. **Zero Production Impact:** Nur in Test-Builds
3. **Type-Safe:** Vollständig typisiert
4. **Extensible:** Diagnostic API später hinzufügbar

## 📊 Erfolgsmetriken

- Test-Ausführungszeit: <5 Minuten für gesamte Suite
- Flakiness: <1% false failures
- Coverage: Alle kritischen User Journeys
- Wartbarkeit: Neue Tests in <30 Minuten schreibbar

## 🚀 Nächste Schritte

1. Phase 1.1 starten: DI-Container analysieren
2. Mit AI-Assistenten jeden Schritt besprechen
3. Iterativ implementieren und validieren
4. Fortschritt in diesem Dokument tracken

---

## 📊 Aktueller Status

### ✅ Abgeschlossene Phasen:
- **Phase 1:** Test Bridge Foundation - Vollständig implementiert
- **Phase 2.1:** Test Data Builders - Vollständig implementiert (Gemini & O3: 9/10)
- **Phase 2.2:** Board Component Object - Vollständig implementiert (Gemini & O3: 9/10)

### 🔄 Aktuelle Phase:
- **Phase 2.3:** MoveList Component Object - Bereit für Konsens-Planung

### 📈 Fortschritt:
- **Test Bridge:** 100% Complete
- **Component Object Model:** 40% Complete (2/5 Components)
- **Gesamtfortschritt:** ~35% Complete

---

*Letzte Aktualisierung: 2025-01-09*
*Status: Phase 2.2 Complete ✅ | Phase 2.3 Ready for Consensus Planning*