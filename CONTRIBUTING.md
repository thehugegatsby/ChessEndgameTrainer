# Contributing to ChessEndgameTrainer

## Architektur: Wo gehört mein Code hin?

Um unsere Codebasis wartbar zu halten, folgen wir klaren Regeln für die Verzeichnisstruktur.

### `shared/lib/`

- **Zweck:** Framework-agnostische, wiederverwendbare Kernlogik und Algorithmen. Code in `lib/` ist pures TypeScript/JavaScript.
- **Regeln:**
  - **Darf NICHT** von React, Zustand oder anderen UI-Frameworks abhängen
  - **Darf NICHT** direkt auf globale Services zugreifen
  - **Sollte** zustandslos sein oder seinen Zustand explizit übergeben bekommen
  - **Beispiele:** PGN-Analyse, FEN-Validierungsfunktionen, Schach-Algorithmen, `chess.js` wrapper

### `shared/services/`

- **Zweck:** Orchestrierung von Geschäftslogik, Kommunikation mit externen APIs und Verwaltung von Anwendungszuständen, die nicht in React-Komponenten gehören.
- **Regeln:**
  - **Darf** von Code in `lib/` abhängen
  - **Darf** mit externen Systemen interagieren (z.B. `fetch` für eine API, `localStorage`)
  - **Sollte** die Schnittstelle zwischen der UI-Schicht (Hooks, Komponenten) und der Kernlogik (`lib/`) oder externen Datenquellen sein
  - **Beispiele:** `TablebaseService` (API-Calls), `ErrorService` (zentrales Logging), `MistakeAnalysisService` (Business Logic)

### `shared/utils/`

- **Zweck:** Kleine, stateless Helper-Funktionen ohne komplexe Geschäftslogik.
- **Regeln:**
  - **Sollte** keine Abhängigkeiten zu `lib/` oder `services/` haben
  - **Sollte** einfache, wiederverwendbare Funktionen enthalten
  - **Beispiele:** `formatDate()`, `titleFormatter()`, `fenValidator()`, kleine String-Manipulationen

### `shared/hooks/`

- **Zweck:** React Hooks für UI-Logik und State-Management.
- **Regeln:**
  - **Muss** mit `use` Prefix benannt werden
  - **Darf** Services und Store verwenden
  - **Sollte** UI-bezogene Logik kapseln
  - **Beispiele:** `useTrainingGame()`, `useDebounce()`, `useLocalStorage()`

### `shared/components/`

- **Zweck:** React UI-Komponenten, organisiert nach Features.
- **Struktur:**
  - `components/ui/` - Generische, wiederverwendbare UI-Komponenten
  - `components/[feature]/` - Feature-spezifische Komponenten (z.B. `training/`, `analysis/`)
- **Regeln:**
  - PascalCase für Komponentennamen
  - Komponenten sollten Hooks für Logik verwenden, nicht direkt Services

---

## Faustregel

- Wenn es reiner Algorithmus oder Datenmodell ist → `lib/`
- Wenn es mit der "Außenwelt" spricht oder App-Logik orchestriert → `services/`
- Wenn es eine kleine, dumme Hilfsfunktion ist → `utils/`
- Wenn es React-spezifische State-Logik ist → `hooks/`
- Wenn es etwas auf dem Bildschirm rendert → `components/`

## Code Style

### Naming Conventions

- **Hooks:** `use` Prefix (z.B. `useTrainingGame`)
- **Services:** PascalCase mit `Service` Suffix (z.B. `ErrorService`)
- **Components:** PascalCase (z.B. `TrainingBoard`)
- **Utils:** camelCase (z.B. `formatPositionTitle`)
- **Constants:** UPPER_CASE (z.B. `ENGINE_DEFAULTS`)
- **Tests:** `.test.ts` oder `.spec.ts` Suffix

### Documentation

Wir verwenden JSDoc für alle exportierten Funktionen und Klassen:

```typescript
/**
 * Hook für effiziente Batch-Bewegungsqualitätsbewertung
 *
 * @param moves - Array von zu analysierenden Zügen
 * @returns Analyse-Ergebnisse mit Qualitätsbewertungen
 */
export function useBatchMoveQuality(moves: Move[]) {
  // Implementation
}
```

ESLint erzwingt JSDoc-Kommentare als Warnings - bitte beheben Sie diese schrittweise.

## Testing

- Minimum 80% Coverage für neue Features
- Unit Tests für alle Services und Hooks
- Integration Tests für kritische User Flows
- Nutze die Test-Factories in `tests/factories/`

## Git Workflow

1. Feature Branch von `main` erstellen
2. Commits mit aussagekräftigen Messages
3. Pull Request mit Beschreibung der Änderungen
4. Code Review abwarten
5. Nach Approval: Squash and Merge

## Vor dem Commit

Stelle sicher, dass:

- `npm test` erfolgreich durchläuft
- `npm run lint` keine Errors zeigt (Warnings sind OK während der Migration)
- `npm run build` erfolgreich ist
- Neue Features dokumentiert sind
