# React-Chessboard v5 API Breaking Changes

**Wichtiger Hinweis für Entwickler:** React-Chessboard v5 hat eine komplett neue API!

## Problem

In unserem Projekt verwenden wir `react-chessboard@5.5.0`, aber die alte v4 API wurde verwendet:

```jsx
// ❌ FALSCH (v4 API)
<Chessboard
  fen={gamePosition}
  onPieceDrop={onPieceDrop}
  boardWidth={400}
  arePiecesDraggable={true}
/>
```

**Resultat:** Brett zeigte immer Startstellung, egal welche FEN geladen wurde!

## Lösung

React-Chessboard v5 erfordert die neue `options` prop:

```jsx
// ✅ RICHTIG (v5 API)
<Chessboard
  options={{
    position: gamePosition,  // 'position' statt 'fen'!
    onPieceDrop: onPieceDrop,
    allowDragging: true,     // 'allowDragging' statt 'arePiecesDraggable'
    id: 'my-board'
  }}
/>
```

### Handler-Signatur geändert

```jsx
// ❌ FALSCH (v4)
const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
  // ...
  return true;
};

// ✅ RICHTIG (v5)  
const onPieceDrop = ({ sourceSquare, targetSquare }: { 
  sourceSquare: string; 
  targetSquare: string | null 
}) => {
  // ...
  return true;
};
```

## Dokumentation lesen

**KRITISCH:** Die offizielle react-chessboard Dokumentation ist unvollständig. 

**Verwende Context7** für aktuelle API-Dokumentation:
1. `mcp__context7__resolve-library-id` mit "react-chessboard"  
2. `mcp__context7__get-library-docs` mit `/clariity/react-chessboard`

## Props-Mapping v4 → v5

| v4 Property | v5 Property (in options) | Notizen |
|-------------|--------------------------|---------|
| `fen` | `position` | Akzeptiert FEN string oder object |
| `arePiecesDraggable` | `allowDragging` | Gleiche Funktionalität |
| `boardWidth` | - | **Entfernt!** Verwende CSS |
| `onPieceDrop(from, to)` | `onPieceDrop({ sourceSquare, targetSquare })` | Neue Signatur |
| `customBoardStyle` | `boardStyle` | Vereinfachter Name |

## Wichtige v5 Features

- `ChessboardProvider` für Spare Pieces
- Bessere Arrow-Unterstützung  
- Responsive Design (kein `boardWidth` mehr)
- Granulare Notation-Styles

## Debugging-Tipp

Wenn das Brett die Startstellung zeigt obwohl korrekter FEN übergeben wird:
1. ✅ Prüfe ob `options.position` verwendet wird
2. ✅ Prüfe Handler-Signaturen  
3. ✅ Verwende Context7 für API-Referenz

---

**Datei erstellt:** 2025-08-19  
**Grund:** E2E Tests zeigten Startstellung trotz korrekter FEN-Strings  
**Lösung:** Context7 Dokumentation + v5 API Migration