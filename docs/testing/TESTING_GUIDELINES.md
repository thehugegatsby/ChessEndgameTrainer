# 🧪 Test-Guideline für den "Claude Build"

## 🎯 Zweck dieser Richtlinie
Diese Guideline stellt sicher, dass alle neuen Tests im "Claude Build" konsistent, wartbar und effektiv sind. Eine robuste Testbasis ist entscheidend, um Fehler bei Upgrades zu vermeiden und das Vertrauen in unseren Code zu stärken.

### 📊 Aktuelle Test-Metriken (Stand: 2025-07-07)
- **Test Coverage**: ~78% (Statement Coverage) - Ziel: 80%
- **Test Success**: 99% (787/796 tests passing, 9 skipped)
- **Neue Tests**: 128 Tests in Phase 2 hinzugefügt
- **Kritische Bugs gefunden**: Perspective Transformation Bug durch Tests entdeckt
- **Error Handling**: ✅ Centralized ErrorService + Logger architecture implementiert

---

## 💡 Grundprinzipien der Teststrategie

1.  **Testpyramide:** Wir streben eine ausgewogene Testpyramide an: Viele schnelle Unit-Tests, eine moderate Anzahl von Integrationstests und wenige, aber aussagekräftige End-to-End-Tests.
2.  **DRY (Don't Repeat Yourself):** Vermeide Code-Duplikation in Tests. Wiederverwendbare Test-Helfer und Fixtures sind erwünscht.
3.  **KISS (Keep It Simple, Stupid):** Halte Tests so einfach und verständlich wie möglich. Jeder Test sollte einen einzigen Zweck verfolgen.
4.  **Testbarkeit:** Schreibe Code, der von Natur aus gut testbar ist. Achte auf lose Kopplung und klare Schnittstellen.
5.  **Regressionstests:** Jeder gefundene und behobene Fehler muss durch einen spezifischen, reproduzierbaren Test abgedeckt werden, der dauerhaft in die Testsuite integriert wird.
6.  ✅ **Was macht einen guten Test aus?**
    Nutze diese Checkliste beim Schreiben und Reviewen:
    - [ ] **Prüft nur eine Sache** (Single Responsibility)
    - [ ] **Lässt sich in wenigen Sekunden lesen und verstehen**
    - [ ] **Erklärt sich selbst** – keine Kommentare notwendig
    - [ ] **Führt bei Fehlschlag zu einem hilfreichen Fehlerbericht**
    - [ ] **Verwendet sprechende Namen** für Test und Mocks
    - [ ] **Vermeidet Magische Werte** (z. B. `expect(x).toBe(42)` → lieber: `expectedMoveCount = 42`)
    - [ ] **Ist unabhängig von Ausführungsreihenfolge**
    - [ ] **Läuft deterministisch** – kein zufälliges Verhalten

---

## 📈 Testtypen & Ihre Anwendung

### 1. Unit Tests (Komponente isoliert)

* **Zweck:** Testen der kleinsten isolierbaren Code-Einheit (z.B. eine Funktion, eine Klasse, ein Modul) in Isolation. Sie prüfen die interne Logik einer Komponente.
* **Eigenschaften:**
    * **Isoliert:** Keine realen Abhängigkeiten (Datenbank, externe APIs, andere komplexe Module). Nutze Mocks/Stubs, um Abhängigkeiten zu isolieren.
    * **Schnell:** Müssen in Millisekunden laufen.
    * **Deterministisch:** Führen immer zum gleichen Ergebnis.
* **Benennungs-Beispiel:** `[KomponentenName]_[Methode]_[Szenario]_[ErwartetesErgebnis]`
    * `ChessBoard_IsValidMove_KingCannotJumpOverPieces_ReturnsFalse`
    * `FenParser_Parse_ValidFenString_ReturnsCorrectBoardState`
* **Ablageort:** `tests/unit/[feature-area-oder-modulname]/`

### 2. Integration Tests (Komponenten-Interaktion)

* **Zweck:** Testen des Zusammenspiels mehrerer Komponenten oder Module, inklusive deren Interaktion mit realen (oder simulierten, aber realistischen) externen Abhängigkeiten.
* **Eigenschaften:**
    * **Fokus auf Schnittstellen:** Prüfen, ob die Kommunikation zwischen Modulen korrekt funktioniert.
    * **Realistische Abhängigkeiten:** Können eine echte Datenbank, einen HTTP-Client oder einen Teil eines externen Dienstes (z.B. Tablebase-API-Aufruf) nutzen.
    * **Langsamer:** Laufen langsamer als Unit-Tests.
* **Benennungs-Beispiel:** `[Modul1]_[Modul2]Integration_[Szenario]_[ErwartetesErgebnis]`
    * `EvaluationApi_TablebaseIntegration_KnownEndgameFen_ReturnsCorrectTablebaseResult`
    * `MoveGenerator_BoardStateConverterIntegration_ComplexPosition_GeneratesAllLegalMoves`
* **Ablageort:** `tests/integration/[feature-area-oder-modulname]/`

### 3. End-to-End (E2E) Tests (Gesamter Benutzerfluss)

* **Zweck:** Testen des gesamten Systems aus Benutzersicht, vom initialen Input bis zur finalen Anzeige in der UI. Sie simulieren echte Benutzerinteraktionen.
* **Eigenschaften:**
    * **Systemweit:** Umfasst Frontend, Backend, Datenbank und alle Integrationen.
    * **Langsam:** Die langsamsten Tests, da sie das gesamte System hochfahren müssen.
    * **Hohes Vertrauen:** Geben das höchste Vertrauen in die Gesamtfunktionalität.
* **Benennungs-Beispiel:** `[BenutzerFlow]_[HauptSzenario]_[ErfolgsKriterium]`
    * `MoveEvaluationFullCycle_KingRookVsKing_CorrectlyDisplaysTablebaseResultAndBestMoves`
    * `UserAuthentication_LoginSuccess_DashboardDisplayed`
* **Ablageort:** `tests/e2e/[user-flow-oder-hauptszenario]/`

---

## 📁 Test-Ordnerstruktur (Empfohlen)

Alle Testdateien sollten sich im `tests/`-Verzeichnis im Projekt-Root befinden und nach Testtyp und optional nach Feature-Bereich/Modul unterteilt sein:

[projekt-root]/
└── tests/
├── unit/
│   ├── core/
│   │   └── ChessEngine.test.js
│   ├── utils/
│   │   └── FenParser.test.js
│   └── ...
├── integration/
│   ├── evaluation-api/
│   │   └── MoveEvaluationEndpoint.test.js
│   ├── tablebase-service/
│   │   └── TablebaseLookup.test.js
│   └── ...
└── e2e/
├── move-evaluation-flows/
│   └── EndgameBrandingTest.test.js
├── user-authentication/
│   └── LoginProcess.test.js
└── ...

Da ich keine Dateien direkt zum Herunterladen bereitstellen kann, gebe ich Ihnen den gesamten Inhalt der "Test Guideline" hier als **einen einzigen Textblock** aus.

Sie können diesen Text einfach kopieren und in einen Texteditor (wie Notepad, VS Code, Sublime Text oder TextEdit) einfügen und dann als `test_guideline.md` speichern. So erhalten Sie eine fertige Markdown-Datei zum Herunterladen auf Ihrem Gerät.

-----

```markdown
# 🧪 Test-Guideline für den "Claude Build"

## 🎯 Zweck dieser Richtlinie
Diese Guideline stellt sicher, dass alle neuen Tests im "Claude Build" konsistent, wartbar und effektiv sind. Eine robuste Testbasis ist entscheidend, um Fehler bei Upgrades zu vermeiden und das Vertrauen in unseren Code zu stärken.

### 📊 Aktuelle Test-Metriken (Stand: 2025-07-07)
- **Test Coverage**: ~78% (Statement Coverage) - Ziel: 80%
- **Test Success**: 99% (787/796 tests passing, 9 skipped)
- **Neue Tests**: 128 Tests in Phase 2 hinzugefügt
- **Kritische Bugs gefunden**: Perspective Transformation Bug durch Tests entdeckt
- **Error Handling**: ✅ Centralized ErrorService + Logger architecture implementiert

---

## 💡 Grundprinzipien der Teststrategie

1.  **Testpyramide:** Wir streben eine ausgewogene Testpyramide an: Viele schnelle Unit-Tests, eine moderate Anzahl von Integrationstests und wenige, aber aussagekräftige End-to-End-Tests.
2.  **DRY (Don't Repeat Yourself):** Vermeide Code-Duplikation in Tests. Wiederverwendbare Test-Helfer und Fixtures sind erwünscht.
3.  **KISS (Keep It Simple, Stupid):** Halte Tests so einfach und verständlich wie möglich. Jeder Test sollte einen einzigen Zweck verfolgen.
4.  **Testbarkeit:** Schreibe Code, der von Natur aus gut testbar ist. Achte auf lose Kopplung und klare Schnittstellen.
5.  **Regressionstests:** Jeder gefundene und behobene Fehler muss durch einen spezifischen, reproduzierbaren Test abgedeckt werden, der dauerhaft in die Testsuite integriert wird.

---

## 📈 Testtypen & Ihre Anwendung

### 1. Unit Tests (Komponente isoliert)

* **Zweck:** Testen der kleinsten isolierbaren Code-Einheit (z.B. eine Funktion, eine Klasse, ein Modul) in Isolation. Sie prüfen die interne Logik einer Komponente.
* **Eigenschaften:**
    * **Isoliert:** Keine realen Abhängigkeiten (Datenbank, externe APIs, andere komplexe Module). Nutze Mocks/Stubs, um Abhängigkeiten zu isolieren.
    * **Schnell:** Müssen in Millisekunden laufen.
    * **Deterministisch:** Führen immer zum gleichen Ergebnis.
* **Benennungs-Beispiel:** `[KomponentenName]_[Methode]_[Szenario]_[ErwartetesErgebnis]`
    * `ChessBoard_IsValidMove_KingCannotJumpOverPieces_ReturnsFalse`
    * `FenParser_Parse_ValidFenString_ReturnsCorrectBoardState`
* **Ablageort:** `tests/unit/[feature-area-oder-modulname]/`

### 2. Integration Tests (Komponenten-Interaktion)

* **Zweck:** Testen des Zusammenspiels mehrerer Komponenten oder Module, inklusive deren Interaktion mit realen (oder simulierten, aber realistischen) externen Abhängigkeiten.
* **Eigenschaften:**
    * **Fokus auf Schnittstellen:** Prüfen, ob die Kommunikation zwischen Modulen korrekt funktioniert.
    * **Realistische Abhängigkeiten:** Können eine echte Datenbank, einen HTTP-Client oder einen Teil eines externen Dienstes (z.B. Tablebase-API-Aufruf) nutzen.
    * **Langsamer:** Laufen langsamer als Unit-Tests.
* **Benennungs-Beispiel:** `[Modul1]_[Modul2]Integration_[Szenario]_[ErwartetesErgebnis]`
    * `EvaluationApi_TablebaseIntegration_KnownEndgameFen_ReturnsCorrectTablebaseResult`
    * `MoveGenerator_BoardStateConverterIntegration_ComplexPosition_GeneratesAllLegalMoves`
* **Ablageort:** `tests/integration/[feature-area-oder-modulname]/`

### 3. End-to-End (E2E) Tests (Gesamter Benutzerfluss)

* **Zweck:** Testen des gesamten Systems aus Benutzersicht, vom initialen Input bis zur finalen Anzeige in der UI. Sie simulieren echte Benutzerinteraktionen.
* **Eigenschaften:**
    * **Systemweit:** Umfasst Frontend, Backend, Datenbank und alle Integrationen.
    * **Langsam:** Die langsamsten Tests, da sie das gesamte System hochfahren müssen.
    * **Hohes Vertrauen:** Geben das höchste Vertrauen in die Gesamtfunktionalität.
* **Benennungs-Beispiel:** `[BenutzerFlow]_[HauptSzenario]_[ErfolgsKriterium]`
    * `MoveEvaluationFullCycle_KingRookVsKing_CorrectlyDisplaysTablebaseResultAndBestMoves`
    * `UserAuthentication_LoginSuccess_DashboardDisplayed`
* **Ablageort:** `tests/e2e/[user-flow-oder-hauptszenario]/`

---

## 📁 Test-Ordnerstruktur (Empfohlen)

Alle Testdateien sollten sich im `tests/`-Verzeichnis im Projekt-Root befinden und nach Testtyp und optional nach Feature-Bereich/Modul unterteilt sein:

```

[projekt-root]/
└── tests/
├── unit/
│   ├── core/
│   │   └── ChessEngine.test.js
│   ├── utils/
│   │   └── FenParser.test.js
│   └── ...
├── integration/
│   ├── evaluation-api/
│   │   └── MoveEvaluationEndpoint.test.js
│   ├── tablebase-service/
│   │   └── TablebaseLookup.test.js
│   └── ...
└── e2e/
├── move-evaluation-flows/
│   └── EndgameBrandingTest.test.js
├── user-authentication/
│   └── LoginProcess.test.js
└── ...

```

---

## ⚙️ Zusätzliche Richtlinien für neue Tests

1.  **Test-Driven Development (TDD):** Versuche, neue Funktionalität nach dem TDD-Prinzip zu entwickeln: Schreibe zuerst den (fehlgeschlagenen) Test, dann den Code, der den Test zum Bestehen bringt, und refaktoriere anschließend.
2.  **Mocks & Stubs:**
    * **In Unit-Tests:** Verwende Mocks/Stubs, um externe Abhängigkeiten zu isolieren und die zu testende Einheit vollständig zu kontrollieren.
    * **In Integration/E2E-Tests:** Vermeide Mocks, wenn eine reale Interaktion getestet werden soll. Setze sie nur ein, wenn eine externe Schnittstelle nicht kontrollierbar oder zu teuer ist.
3.  **Testdatenmanagement:**
    * Verwalte Testdaten explizit und versioniere sie (z.B. in separaten Dateien oder innerhalb der Testsuite).
    * Für die **Zugbewertung**: Eine Datenbank mit kritischen FEN-Strings, ihren Tablebase-Bewertungen und erwarteten Engine-Bewertungen ist unerlässlich.
4.  **Automatisierung (CI/CD):**
    * Alle Tests müssen Teil der automatisierten CI/CD-Pipeline sein.
    * Unit-Tests sollten bei jedem Push laufen. Integration- und E2E-Tests können in längeren, aber regelmäßigen Zyklen laufen.
5.  **Code Coverage:** Strebe eine hohe Testabdeckung an (z.B. 80%+ für Unit-Tests in kritischen Modulen), aber fokussiere dich auf die Qualität der Tests, nicht nur auf die Zahl.
6.  **Code Reviews:** Tests sind ein integraler Bestandteil des Code Reviews. Prüfe die Testqualität genauso wie die Code-Qualität.

---

## ♟️ Domänen-Spezifische Tests (Fokus auf Schach-Bewertung - `o3 / ZEN MCP` Perspektive)

Besonders für die Zugbewertung ist Präzision unerlässlich:

### Evaluation Pipeline Tests
Die Evaluation Pipeline besteht aus mehreren unabhängigen Komponenten mit klarer Verantwortungstrennung:

* **PlayerPerspectiveTransformer Tests**:
  - Testet die korrekte Perspektiven-Transformation für Schwarz/Weiß
  - Verifiziert, dass Evaluierungen für Schwarz invertiert werden
  - Stellt sicher, dass Weiß-Perspektive unverändert bleibt
  
* **EvaluationDeduplicator Tests**:
  - Testet die Entfernung von Duplikaten in Evaluierungssequenzen
  - Verifiziert die Beibehaltung der richtigen Reihenfolge
  - Prüft Edge Cases wie leere Arrays und einzelne Evaluierungen

* **ChessAwareCache Tests**:
  - Testet schachspezifische Cache-Optimierungen
  - Verifiziert Cache-Invalidierung bei Materialänderungen
  - Prüft symmetrische Stellungserkennung
  - Testet LRU-Eviction bei Cache-Überlauf

### Error Handling Tests
Mit der zentralisierten Error-Handling-Architektur sollten Tests folgende Patterns verwenden:

* **ErrorService Tests**:
  - Verifiziert korrekte Kategorisierung von Fehlern (Critical vs Non-Critical)
  - Testet User-Message Generation für verschiedene Fehlertypen
  - Prüft Context-Daten Weiterleitung für Debugging
  - Validiert Error-Recovery Mechanismen

* **Logger Integration Tests**:
  - Testet strukturierte Log-Ausgabe mit Timestamps
  - Verifiziert Log-Level Konfiguration (DEBUG, INFO, WARN, ERROR)
  - Prüft Platform-Context Injection in Log-Messages
  - Testet Log-Transport Konfiguration

* **Test Pattern für Error Handling**:
  ```typescript
  // Mocking für Error Tests
  const logger = getLogger();
  const loggerSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
  
  // Error Service Testing
  const userMessage = ErrorService.handleChessEngineError(testError, {
    component: 'TestComponent',
    action: 'testAction',
    additionalData: { testData: 'value' }
  });
  
  expect(userMessage).toContain('Engine temporarily unavailable');
  expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
  ```

* **Tablebase-Validierung:** Teste explizit, ob bei Endspielen, die in Tablebases enthalten sind, **immer die exakten Tablebase-Ergebnisse** abgerufen und verwendet werden, und ob diese die Engine-Schätzungen korrekt **übersteuern**.
* **FEN-Szenarien:** Baue eine Test-Suite mit bekannten FEN-Positionen (z.B. Matt in N Zügen, Remis-Stellungen, Gewinn-Stellungen) und verifiziere die **exakte numerische und qualitative Bewertung**.
* **Blunder- & Optimale-Zug-Verifikation:** Teste spezifische Züge, die bekannt gute oder bekannte fehlerhafte Züge sind, und verifiziere, dass sie mit den **korrekten Symbolen und Labels der Legende** angezeigt werden.
    * Beispiel: Der Blunder `Kb5` in der Stellung `2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1` muss mit `🚨` (Sieg → Remis weggeworfen) visualisiert werden.
* **Grenzfälle:** Teste Positionen, die Pattsituationen, Dauerschach, unmögliche Stellungen oder andere Regelbesonderheiten beinhalten.

---
```