# Critical E2E Test Scenarios - ChessEndgameTrainer

## 🎯 Top 5 Kritische User Journeys

Basierend auf Business Value und User Impact, identifiziert mit Gemini 2.5 Pro.

### 1. **Erfolgreicher Trainings-Abschluss ("Happy Path")**
**Kritikalität:** EXTREM HOCH  
**User Story:** "Als Nutzer wähle ich ein Endspiel-Szenario, spiele die korrekten Züge und gewinne."

**Test Coverage:**
- Szenario laden
- Züge ausführen (Click/Drag)
- Engine-Antworten erhalten
- Spielende erkennen (Schachmatt)
- Erfolgsmeldung anzeigen

**File:** `training-happy-path.spec.ts`

### 2. **Interaktive Zugbewertung**
**Kritikalität:** EXTREM HOCH  
**User Story:** "Als Nutzer sehe ich sofort, ob mein Zug optimal/sicher/fehler war."

**Test Coverage:**
- Zug ausführen
- Bewertung empfangen (optimal/sicher/umweg/riskant/fehler)
- UI-Feedback anzeigen
- Engine-Gegenzug verarbeiten

**File:** `move-evaluation.spec.ts`

### 3. **Fehlerbehandlung mit Undo**
**Kritikalität:** HOCH  
**User Story:** "Als Nutzer kann ich Fehler machen, daraus lernen und den Zug zurücknehmen."

**Test Coverage:**
- Fehlerhaften Zug machen
- "Fehler"-Bewertung erhalten
- Engine nutzt Fehler aus
- Undo-Funktion nutzen
- Brett-Zustand wiederherstellen

**File:** `error-handling-undo.spec.ts`

### 4. **Szenario-Navigation**
**Kritikalität:** HOCH  
**User Story:** "Als Nutzer navigiere ich zwischen Trainings-Szenarien und sehe meinen Fortschritt."

**Test Coverage:**
- Szenario-Liste anzeigen
- Szenario auswählen
- Nach Abschluss als "erledigt" markieren
- Zum nächsten Szenario wechseln

**File:** `scenario-navigation.spec.ts`

### 5. **Session-Persistenz**
**Kritikalität:** MITTEL-HOCH  
**User Story:** "Als Nutzer kann ich das Training unterbrechen und später fortsetzen."

**Test Coverage:**
- Spielzustand speichern
- Browser/Tab schließen
- Wieder öffnen
- Exakt gleiche Position laden
- Weiterspielen können

**File:** `session-persistence.spec.ts`

## 📊 Mapping zu Legacy Tests

| Neuer Test | Ersetzt Legacy Test(s) |
|------------|------------------------|
| training-happy-path | smoke-com, pawn-endgame-win |
| move-evaluation | engine-integration |
| error-handling-undo | engine-integration, move-navigation |
| scenario-navigation | move-navigation |
| session-persistence | NEU (moderne Anforderung) |

## 🚀 Implementierungs-Reihenfolge

1. **training-happy-path** - Basis-Funktionalität
2. **move-evaluation** - Core Feature (USP)
3. **error-handling-undo** - User Experience
4. **scenario-navigation** - Content Navigation
5. **session-persistence** - Quality of Life

## ⚡ Quick Win Potential

- Test 1 & 2 können Teile des gleichen Setups nutzen
- Test 3 baut auf Test 2 auf
- Test 4 kann initial vereinfacht werden (ohne Fortschritt)
- Test 5 kann später hinzugefügt werden

## 📝 Test Pattern

```typescript
test.describe('Critical: [Feature Name]', () => {
  test('[specific user journey]', async ({ page }) => {
    // Arrange
    const driver = new ModernDriver(page, { useTestBridge: true });
    
    // Act
    await driver.visit('/train/1');
    await driver.board.makeMove('e2', 'e4');
    
    // Assert
    const evaluation = await driver.movePanel.getLastEvaluation();
    expect(evaluation).toBe('optimal');
  });
});
```