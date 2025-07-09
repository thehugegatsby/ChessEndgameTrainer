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

#### 1.4 Integration der Test Bridge in den DI-Container
- **Ziel:** Bridge mit DI-Container verbinden
- **Warum:** Zugriff auf MockEngineService ermöglichen
- **Deliverable:** Bridge kann Mocks konfigurieren

#### 1.5 Erstellen eines Test-Build-Flags
- **Ziel:** Bridge nur in Test-Builds laden
- **Warum:** Zero production overhead
- **Deliverable:** Conditional loading implementiert

### Phase 2: Abstraktion Layer (Priorität: HIGH)

#### 2.1 Erstellen der Board POM Klasse
- **Ziel:** Page Object für Schachbrett
- **Features:** drag-and-drop, getPiece(), makeMove()
- **Deliverable:** Board.ts mit allen Interaktionen

#### 2.2 Erstellen der MoveList POM Klasse
- **Ziel:** Page Object für Zugliste
- **Features:** getMoves(), expectLastMove()
- **Deliverable:** MoveList.ts

#### 2.3 Erstellen der EvaluationPanel POM Klasse
- **Ziel:** Page Object für Engine-Bewertung
- **Features:** getEvaluation(), getBestMove()
- **Deliverable:** EvaluationPanel.ts

#### 2.4 Implementierung des AppDriver
- **Ziel:** Zentrale Fassade für alle POMs
- **Warum:** Tests sollen nur mit AppDriver interagieren
- **Deliverable:** AppDriver.ts als Orchestrator

#### 2.5 Erstellen von Playwright Test-Fixtures
- **Ziel:** Wiederverwendbare Test-Setups
- **Beispiele:** "leeres Brett", "Opposition Position"
- **Deliverable:** fixtures.ts

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

*Letzte Aktualisierung: 2025-01-09*
*Status: Planning Complete - Ready for Implementation*