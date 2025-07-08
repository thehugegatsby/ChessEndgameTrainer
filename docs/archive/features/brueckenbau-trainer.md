# BRÜCKENBAU-TRAINER - Erweiterte Zugbewertung für strukturiertes Endspiel-Training

## ⚠️ WICHTIG FÜR CLAUDE CODE
**Dieses Dokument bitte vollständig in CLAUDE.md integrieren oder als eigenständige Spezifikation für die Umsetzung nutzen.**

## 📊 Implementierungsstatus (Stand: 2025-01-17)
- **Phase P1**: ✅ ABGESCHLOSSEN - Datenmodell erweitert
- **Phase P2**: ✅ ABGESCHLOSSEN - Bewertungslogik implementiert  
- **Phase P3**: ⏳ IN ARBEIT - UI-Integration
- **Phase P4**: 🔜 GEPLANT - Karten-System

---

## 1. Vision & Leitprinzipien

### Kernvision
Erweiterung des bestehenden Tablebase-Bewertungssystems um eine 5-stufige Qualitätsklassifikation für Win→Win Züge. Fokus auf "sicher vor perfekt" - Züge die den Gewinn zuverlässig festhalten werden höher bewertet als riskante Perfekt-Züge.

### Leitprinzipien
1. **Didaktische Staffelung** – Lernende arbeiten sich von fast gewonnenen zu komplexeren Stellungen vor
2. **Priorität "sicher vor perfekt"** – Zuverlässige Gewinntechnik > optimale Engine-Züge  
3. **Mikro-Einheiten** – Jede Schlüsselstellung wird zu einer eigenständigen Lernkarte
4. **Motivierendes Feedback** – Badges und klare Fortschrittsanzeige
5. **Bestehende Integration** – Erweitert vorhandenes System, ersetzt es nicht

---

## 2. Qualitätsklassen (Finale Spezifikation)

### Primäre Klassifikation (basierend auf ΔDTM)

| Klasse  | ΔDTM-Kriterium | Icon | Kurztext         | Beschreibung                           |
|---------|----------------|------|------------------|----------------------------------------|
| optimal | ≤ 1            | 🟢   | Kürzester Weg    | Optimaler oder fast optimaler Zug      |
| sicher  | ≤ 5            | ✅   | Sichere Technik  | Zuverlässige Gewinntechnik             |
| umweg   | ≤ 15           | 🟡   | Dauert länger    | Funktioniert, aber ineffizient         |
| riskant | > 15 & Win     | ⚠️   | Gewinn fragil    | Gewinn bleibt, aber sehr kompliziert   |
| fehler  | Win→Draw/Loss  | 🚨   | Gewinn verspielt | Objektivverlust (bestehende Logik)     |

### Sekundäre Klassifikation (Robustheit)

| Tag     | Kriterium               | Bedeutung                    |
|---------|-------------------------|------------------------------|
| robust  | ≥ 3 Gewinnzüge         | Viele gute Alternativen      |
| präzise | = 2 Gewinnzüge         | Wenige gute Optionen         |
| haarig  | = 1 Gewinnzug          | Nur dieser Zug gewinnt       |

---

## 3. Technische Spezifikation

### 3.1 Erweiterte Datenstrukturen

```typescript
// Erweiterung des bestehenden TablebaseData Interface
interface EnhancedTablebaseData extends TablebaseData {
  // Bestehend bleibt:
  isTablebasePosition: boolean;
  wdlBefore?: number;
  wdlAfter?: number;
  category?: string;
  dtz?: number;
  
  // NEU für Brückenbau-Trainer:
  dtmBefore?: number;        // Distance to Mate vor dem Zug
  dtmAfter?: number;         // Distance to Mate nach dem Zug
  moveQuality?: MoveQualityClass;
  robustness?: RobustnessTag;
  winningMovesCount?: number; // Anzahl gewinnender Züge in Position
}

type MoveQualityClass = 'optimal' | 'sicher' | 'umweg' | 'riskant' | 'fehler';
type RobustnessTag = 'robust' | 'präzise' | 'haarig';

// Erweiterte Evaluation Display
interface EnhancedEvaluationDisplay extends EvaluationDisplay {
  // Bestehend bleibt:
  text: string;
  className: string; 
  color: string;
  bgColor: string;
  
  // NEU:
  qualityClass: MoveQualityClass;
  robustnessTag?: RobustnessTag;
  dtmDifference?: number;
  educationalTip: string;
}
```

### 3.2 Bewertungslogik

```typescript
// Hauptfunktion für erweiterte Bewertung
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
    
    return {
      ...baseEval,
      qualityClass,
      robustnessTag: robustness,
      dtmDifference: dtmDiff,
      educationalTip: getEducationalTip(qualityClass, robustness)
    };
  }
  
  // 3. Andere Übergänge: Bestehende Logik mit Mapping
  return mapToEnhanced(baseEval);
};

// ΔDTM-basierte Klassifikation
const classifyWinToWin = (dtmDiff: number): MoveQualityClass => {
  if (dtmDiff <= 1) return 'optimal';
  if (dtmDiff <= 5) return 'sicher'; 
  if (dtmDiff <= 15) return 'umweg';
  return 'riskant';
};

// Robustheitsbewertung
const classifyRobustness = (winningMoves: number): RobustnessTag => {
  if (winningMoves >= 3) return 'robust';
  if (winningMoves === 2) return 'präzise';
  return 'haarig';
};
```

### 3.3 Pädagogische Inhalte

```typescript
// Lernhinweise für jede Qualitätsklasse
export const EDUCATIONAL_CONTENT = {
  optimal: {
    tip: "Perfekt! Kürzester Weg zum Gewinn.",
    principle: "Effizienz",
    encouragement: "Du beherrschst die optimale Technik!"
  },
  sicher: {
    tip: "Ausgezeichnet! Sichere und zuverlässige Gewinntechnik.", 
    principle: "Sicherheit",
    encouragement: "Genau so gewinnt man Endspiele!"
  },
  umweg: {
    tip: "Funktioniert, aber es gibt effizientere Wege.",
    principle: "Verbesserung", 
    encouragement: "Gewinn ist gewinn - nächstes Mal noch besser!"
  },
  riskant: {
    tip: "Gewinn bleibt, aber sehr kompliziert. Sicherere Alternativen prüfen.",
    principle: "Risikomanagement",
    encouragement: "Mutig! Aber Sicherheit geht vor."
  },
  fehler: {
    tip: "Gewinn weggegeben! In gewonnenen Stellungen vorsichtiger spielen.",
    principle: "Verlustprävention", 
    encouragement: "Kein Problem - daraus lernen wir!"
  }
} as const;

// Robustheitsinformationen
export const ROBUSTNESS_INFO = {
  robust: "Viele gute Züge verfügbar - entspannte Stellung",
  präzise: "Wenige gute Optionen - Vorsicht geboten", 
  haarig: "Nur wenige Züge gewinnen - höchste Präzision nötig"
} as const;
```

---

## 4. Pilot-Lesson: Brückenbau-Endspiele

### 4.1 Karte 1: "Zickzack-Finale"
**Ausgangsstellung**: `8/8/8/8/8/2K5/2P5/2k5 w - - 0 1`
(König + Bauer vs König, Bauer kurz vor Umwandlung)

**Lernziele**:
1. König korrekt vor Bauer ziehen
2. Zickzack-Technik bei Opposition
3. Umwandlung sicherstellen

**To-dos**:
- ✅ König auf Umwandlungsfeld dirigieren
- ✅ Bei Opposition richtig ausweichen  
- ✅ Bauer sicher zur Dame bringen

### 4.2 Karte 2: "Turm-Brücke aufbauen"
**Ausgangsstellung**: `8/8/8/8/8/2k5/8/2KR4 w - - 0 1`
(Turm + König vs König, Grundstellung für Brückenbau)

**Lernziele**:
1. Turm auf richtige Reihe/Linie  
2. König zur Unterstützung
3. Gegnerischen König abdrängen

**To-dos**:
- ✅ Turm optimal positionieren
- ✅ König aktivieren
- ✅ Gewinnende Struktur aufbauen

### 4.3 Karte 3: "König abdrängen"
**Ausgangsstellung**: `8/8/8/3k4/8/3K4/8/3R4 w - - 0 1`
(Aktive Stellung, König muss abgedrängt werden)

**Lernziele**:
1. Raumgewinn Schritt für Schritt
2. Koordination von Turm und König
3. Gegner in die Ecke drängen

**To-dos**:
- ✅ Raum systematisch erobern
- ✅ Figuren koordiniert einsetzen
- ✅ Mattstellung erreichen

---

## 5. UI/UX Integration

### 5.1 Erweiterte MovePanel-Anzeige

```typescript
// Erweiterte Move-Button-Komponente
const EnhancedMoveButton = ({ move, evaluation, isWhite }) => {
  const enhancedEval = getEnhancedMoveQuality(evaluation);
  
  return (
    <div className="move-container">
      {/* Bestehender Move-Button */}
      <button className="move-button">{move.san}</button>
      
      {/* NEU: Erweiterte Bewertungsanzeige */}
      <div className={`quality-badge ${enhancedEval.qualityClass}`}>
        {enhancedEval.text}
        {enhancedEval.robustnessTag && (
          <span className="robustness-indicator">
            {getRobustnessIcon(enhancedEval.robustnessTag)}
          </span>
        )}
      </div>
      
      {/* NEU: Tooltip mit Lerninhalt */}
      <div className="educational-tooltip">
        <strong>{enhancedEval.educationalTip}</strong>
        <br/>
        <em>{ROBUSTNESS_INFO[enhancedEval.robustnessTag]}</em>
      </div>
    </div>
  );
};
```

### 5.2 Karten-Übersicht

```typescript
// Neue Komponente für Lektionsauswahl
const BridgeTrainerLessons = () => {
  return (
    <div className="lessons-grid">
      {BRIDGE_LESSONS.map(lesson => (
        <LessonCard 
          key={lesson.id}
          title={lesson.title}
          description={lesson.description} 
          difficulty={lesson.difficulty}
          completed={lesson.completed}
          todos={lesson.todos}
        />
      ))}
    </div>
  );
};
```

### 5.3 Erweiterte Legende

```typescript
export const ENHANCED_LEGEND = {
  // Qualitätsklassen
  '🟢': 'Optimal - Kürzester Weg',
  '✅': 'Sicher - Zuverlässige Technik',
  '🟡': 'Umweg - Dauert länger', 
  '⚠️': 'Riskant - Gewinn fragil',
  '🚨': 'Fehler - Gewinn verspielt',
  
  // Robustheit (als kleine Indikatoren)
  '●●●': 'Robust - Viele gute Züge',
  '●●○': 'Präzise - Wenige Optionen',
  '●○○': 'Haarig - Nur wenige Züge gewinnen'
};
```

---

## 6. Implementierungs-Phasen

### Phase P0: Scoping (✅ Erledigt)
- [x] Qualitätsklassen definiert
- [x] 3 Pilotkarten spezifiziert  
- [x] ΔDTM-Grenzen festgelegt
- [x] Technische Struktur geplant

### Phase P1: Datenmodell erweitern
**Aufgaben für Claude Code**:
1. `EnhancedTablebaseData` Interface zu `types/evaluation.ts` hinzufügen
2. `EnhancedEvaluationDisplay` Interface definieren
3. `MoveQualityClass` und `RobustnessTag` Types erstellen
4. Rückwärtskompatibilität sicherstellen

**Fertig wenn**: Alle Types kompilieren, bestehender Code läuft unverändert

### Phase P2: Bewertungslogik implementieren
**Aufgaben für Claude Code**:
1. `getEnhancedMoveQuality()` Funktion in `evaluationHelpers.ts`
2. `classifyWinToWin()` und `classifyRobustness()` Helper
3. `EDUCATIONAL_CONTENT` Konstanten hinzufügen
4. Integration mit bestehender `getMoveQualityByTablebaseComparison()`

**Fertig wenn**: Testfälle für alle Qualitätsklassen bestehen

### Phase P3: UI-Integration
**Aufgaben für Claude Code**:
1. `MovePanel.tsx` um Enhanced Display erweitern
2. Neue CSS-Klassen für Qualitätsbadges
3. Tooltip-Komponente für Lernhinweise  
4. Erweiterte Legende implementieren

**Fertig wenn**: UI zeigt neue Bewertungen korrekt an

### Phase P4: Karten-System (Future)
**Aufgaben für Claude Code**:
1. `BridgeTrainerLessons` Komponente
2. `LessonCard` mit To-do-Tracking
3. Fortschritts-Persistierung
4. Navigation zwischen Karten

**Fertig wenn**: 3 Pilotkarten spielbar sind

---

## 7. Testplan

### 7.1 Mock-Stellungen für Unit Tests

```typescript
// Test-Cases für Qualitätsklassifikation
const TEST_CASES = [
  {
    name: "Optimal - perfekter Zug",
    wdlBefore: 2, wdlAfter: 2,
    dtmBefore: 15, dtmAfter: 14,
    winningMoves: 3,
    expected: { class: 'optimal', robustness: 'robust' }
  },
  {
    name: "Sicher - gute Technik",  
    wdlBefore: 2, wdlAfter: 2,
    dtmBefore: 10, dtmAfter: 14,
    winningMoves: 2, 
    expected: { class: 'sicher', robustness: 'präzise' }
  },
  {
    name: "Umweg - ineffizient aber sicher",
    wdlBefore: 2, wdlAfter: 2, 
    dtmBefore: 8, dtmAfter: 20,
    winningMoves: 1,
    expected: { class: 'umweg', robustness: 'haarig' }
  },
  {
    name: "Riskant - sehr langer Umweg",
    wdlBefore: 2, wdlAfter: 2,
    dtmBefore: 5, dtmAfter: 25, 
    winningMoves: 1,
    expected: { class: 'riskant', robustness: 'haarig' }
  },
  {
    name: "Fehler - Gewinn weggeworfen",
    wdlBefore: 2, wdlAfter: 0,
    dtmBefore: 10, dtmAfter: undefined,
    winningMoves: 0,
    expected: { class: 'fehler', robustness: undefined }
  }
];
```

### 7.2 Integration Tests
1. **Rückwärtskompatibilität**: Bestehende Bewertungen unverändert
2. **Performance**: Neue Klassifikation unter 50ms
3. **UI-Konsistenz**: Korrekte Badge-Anzeige für alle Klassen
4. **Tooltip-Funktionalität**: Lernhinweise erscheinen bei Hover

---

## 8. Konfigurierbare Parameter

```typescript
// Tuning-Parameter für spätere Anpassung
export const BRIDGE_TRAINER_CONFIG = {
  // ΔDTM Schwellenwerte
  dtmThresholds: {
    optimal: 1,
    sicher: 5, 
    umweg: 15
  },
  
  // Robustheitsgrenzen
  robustnessThresholds: {
    robust: 3,
    präzise: 2
  },
  
  // UI-Einstellungen
  ui: {
    showRobustnessIndicator: true,
    showDtmDifference: false, // Für Experten-Modus
    tooltipDelay: 500
  },
  
  // Lektions-System
  lessons: {
    unlockProgressive: true, // Karten nacheinander freischalten
    repeatOnFailure: true,
    maxRetries: 3
  }
};
```

---

## 9. Analytics & Telemetrie

### Events für Lernoptimierung
```typescript
// Tracking-Events für Verbesserung
const TRACKING_EVENTS = {
  'move_quality_classified': {
    qualityClass: string,
    robustnessTag: string, 
    dtmDifference: number,
    lessonId?: string
  },
  
  'lesson_card_completed': {
    lessonId: string,
    duration: number,
    mistakeCount: number, 
    retryCount: number
  },
  
  'quality_improvement': {
    fromClass: string,
    toClass: string,
    lessonId: string
  }
};
```

---

## 10. Launch-Checkliste

### Beta-Kriterien
- [ ] Alle 5 Qualitätsklassen funktionieren
- [ ] UI zeigt Enhanced Bewertungen korrekt
- [ ] 3 Pilotkarten vollständig implementiert
- [ ] Performance unter 100ms pro Bewertung
- [ ] Rückwärtskompatibilität zu 100% erhalten

### Public Launch
- [ ] Mindestens 10 Brückenbau-Karten verfügbar
- [ ] Fortschritts-Tracking implementiert
- [ ] Mobile-optimierte Darstellung
- [ ] Analytics-Dashboard für Lernstatistiken
- [ ] Dokumentation für Content-Erweiterung

---

## 11. Nächste Entwicklungsschritte

### Sofort umsetzbar (Phase P1-P2)
1. **Types erweitern** - EnhancedTablebaseData Interface
2. **Bewertungslogik** - getEnhancedMoveQuality() implementieren  
3. **Tests schreiben** - für alle 5 Qualitätsklassen
4. **MovePanel erweitern** - Enhanced Badges anzeigen

### Mittelfristig (Phase P3-P4)  
1. **Karten-System** - Strukturierte Lektionen
2. **Fortschritts-Tracking** - Persistente To-do-Listen
3. **Content-Expansion** - Mehr Endspieltypen
4. **Adaptive Schwierigkeit** - Basierend auf Nutzerdaten

---

## 12. Didaktische Verbesserungen (2025-01-04)

### Problemanalyse
Schwächere Spieler machen oft zufällige Züge ohne klares Verständnis des Brückenbau-Prinzips. Sie erhalten wenig strukturiertes Feedback und verstehen nicht, warum ihre Züge gut oder schlecht sind.

### Ziel
Spieler sollen am Ende in der Lage sein zu erkennen: "AHA, Brückenbau-Stellung! Jetzt sind meine Ziele: König auf die 8. Reihe, Bauer auf die 7., dann König abdrängen, Turm auf die 5. Reihe und dann Brückenbau machen."

### Empfohlene Features (Priorisiert nach Nutzen/Aufwand)

#### 1. **Visuelle Feldmarkierung** (Höchste Priorität - Quick Win)
Mit `react-chessboard` und der `customSquareStyles` prop:
```typescript
const highlightStyles = {
  'a8': { backgroundColor: 'rgba(0, 255, 0, 0.4)' }, // Königsziel
  'b8': { backgroundColor: 'rgba(0, 255, 0, 0.4)' }, // Königsziel
  'c8': { backgroundColor: 'rgba(0, 255, 0, 0.4)' }, // Königsziel
  'e5': { backgroundColor: 'rgba(0, 0, 255, 0.4)' }, // Turm-Kontrolllinie
  'f7': { backgroundColor: 'rgba(255, 0, 0, 0.4)' }  // Gefahrenzone für gegn. König
};
```
**Nutzen**: Entlastet kognitives Gedächtnis, Spieler *sehen* wichtige Felder
**Aufwand**: Minimal mit bestehender react-chessboard API

#### 2. **Phasen-Tracking-System** (Priorität 2)
```typescript
interface BridgePhase {
  id: number;
  name: string;
  criteria: (position: Chess) => boolean;
  hint: string;
  icon: string;
}

const phases: BridgePhase[] = [
  { 
    id: 1, 
    name: "König zur 8. Reihe",
    criteria: (pos) => getKingRank(pos, 'w') === 8,
    hint: "Bringe deinen König zur 8. Reihe",
    icon: "👑"
  },
  { 
    id: 2, 
    name: "Bauer auf 7. Reihe",
    criteria: (pos) => getPawnRank(pos, 'w') === 7,
    hint: "Der Bauer muss auf die 7. Reihe",
    icon: "♟️"
  },
  { 
    id: 3, 
    name: "König abdrängen",
    criteria: (pos) => getKingDistance(pos) > 2,
    hint: "Dränge den gegnerischen König ab",
    icon: "🚫"
  },
  { 
    id: 4, 
    name: "Turm-Brücke bauen",
    criteria: (pos) => isRookOnCorrectRank(pos),
    hint: "Turm auf die 5. Reihe für die Brücke",
    icon: "🌉"
  }
];
```

**UI-Anzeige**:
```
Brückenbau - Phase 2/4
✅ König auf 8. Reihe
⏳ Bauer auf 7. Reihe (aktuell)
⏹️ Gegnerischen König abdrängen
⏹️ Turm-Brücke bauen
```

**Nutzen**: Gibt Struktur und Orientierung, macht Fortschritt sichtbar
**Aufwand**: Mittel - Phasen-Kriterien müssen klar definiert werden

#### 3. **Kontextuelle Zugbewertungen** (Priorität 3)
Erweitern der bestehenden Evaluation-Display:
```typescript
const bridgeSpecificFeedback = {
  'optimal': {
    base: '🟢 Perfekt!',
    phase1: 'König nähert sich der 8. Reihe',
    phase2: 'Bauer rückt sicher vor',
    phase3: 'Gegnerischer König wird abgedrängt',
    phase4: 'Turm kontrolliert die wichtige Linie'
  },
  'good': {
    base: '✅ Gut!',
    phase1: 'Richtige Richtung für den König',
    phase2: 'Bauer-Vorstoß vorbereitet',
    phase3: 'Du gewinnst Raum',
    phase4: 'Turm gut positioniert'
  },
  'mistake': {
    base: '🔻 Vorsicht!',
    phase1: 'König entfernt sich vom Ziel',
    phase2: 'Bauer zu früh vorgezogen',
    phase3: 'Gegnerischer König wird wieder aktiv',
    phase4: 'Turm verliert die Kontrolle'
  }
};
```

**Nutzen**: Spezifisches Feedback statt generischer Bewertungen
**Aufwand**: Baut auf bestehender Infrastruktur auf

### Mittelfristige Features (Phase 2)

#### 4. **Adaptive Hilfe-Stufen**
Nach 3 suboptimalen Zügen in derselben Phase:
- Level 1: "Denk an die Königsposition" (allgemein)
- Level 2: "Der König muss näher zur 8. Reihe" (spezifisch)
- Level 3: "Versuch Kd7" (konkret)

#### 5. **Fehleranalyse mit Erklärung**
Bei Fehlern:
- "Warum war das ein Fehler?" Button
- Visualisierung der besseren Alternative
- Mini-Lektion zum verpassten Konzept

#### 6. **Interaktive Demos**
- "Demo ansehen" Button bei Stagnation
- Animierte Demonstration der korrekten Technik
- Slow-Motion mit Erklärungen

### Technische Integration

**Bestehende Infrastruktur nutzen**:
- `react-chessboard` für visuelle Markierungen
- `TrainingContext` für Phasen-State
- `EvaluationDisplay` für erweitertes Feedback
- `chess.js` für Position-Analyse

**Neue Komponenten**:
- `BridgePhaseTracker` - Anzeige des aktuellen Fortschritts
- `FieldHighlighter` - Visuelle Feldmarkierungen
- `AdaptiveHintSystem` - Gestufte Hilfestellung

### Erwartete Ergebnisse

1. **Bessere Mustererkennung**: Spieler erkennen Brückenbau-Stellungen sofort
2. **Strukturiertes Lernen**: Klare Phasen statt chaotisches Probieren
3. **Höhere Erfolgsquote**: Durch visuelle Hilfen und strukturiertes Feedback
4. **Nachhaltigeres Lernen**: Prinzipien verstehen statt Züge auswendig lernen

### Implementierungsreihenfolge

1. **Woche 1**: Visuelle Feldmarkierung (Quick Win)
2. **Woche 2**: Phasen-Tracking-System
3. **Woche 3**: Kontextuelle Zugbewertungen
4. **Woche 4**: Testing und Feinabstimmung
5. **Später**: Adaptive Features basierend auf Nutzerfeedback

---

**Dieses Dokument dient als vollständige Spezifikation für Claude Code zur autonomen Umsetzung des erweiterten Brückenbau-Trainers.**