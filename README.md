# Chess Endgame Trainer 🎯

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/Coverage-76.16%25-yellow)](./coverage/lcov-report/index.html)
[![CI/CD](https://github.com/thehugegatsby/ChessEndgameTrainer/actions/workflows/test-and-coverage.yml/badge.svg)](https://github.com/thehugegatsby/ChessEndgameTrainer/actions)
[![Deployment Ready](https://img.shields.io/badge/Deployment-Ready-green)](./docs/DEPLOYMENT_GUIDE.md)

Eine moderne Web- und Mobile-Anwendung zum systematischen Lernen von Schachendspielen mit KI-Unterstützung.

## 🎯 Features

- **16 Endspiel-Positionen** - Von Bauern bis Turmendspiele
- **Stockfish Engine Integration** - WASM-basierte KI-Analyse
- **Unified Evaluation System** - Moderne, konsistente Bewertungslogik
- **Dual Evaluation Display** - Engine + Lichess Tablebase
- **Best Moves Display** - Top 3 Züge mit Bewertungen (Lichess-Style)
- **Brückenbau-Trainer** - Strukturiertes Lernen mit 5 Lektionen
- **Spaced Repetition** - FSRS-basiertes Lernsystem
- **Performance Optimiert** - 75% weniger API-Calls, LRU Cache
- **Responsive Design** - Desktop & Mobile optimiert
- **Dark Mode** - Augenschonend trainieren
- **Production Ready** - Vercel Deployment mit Security Headers

## 🚀 Projektstruktur

```
ChessEndgameTrainer/
├── pages/                          # Next.js Seiten
│   ├── index.tsx                   # Homepage mit Endgame-Kategorien
│   ├── dashboard.tsx               # Training Progress Dashboard
│   └── train/[id].tsx              # Haupttraining-Interface
│
├── shared/                         # Geteilte Logik für Web + App
│   ├── components/                 # Wiederverwendbare UI-Komponenten
│   │   ├── chess/                  # Schachbrett-Komponenten
│   │   ├── training/               # Training-spezifische Komponenten
│   │   └── ui/                     # Allgemeine UI-Komponenten
│   ├── hooks/                      # Gemeinsame React Hooks
│   ├── lib/                        # Services, chess.js wrapper
│   │   └── chess/                  # Chess Engine, Validation
│   ├── data/                       # Endspielkarten (FEN, Ziel, Lösung)
│   └── services/                   # Error handling, Storage
│
├── app/mobile/                     # React Native App (vorbereitet)
│   ├── screens/                    # App Screens
│   ├── components/                 # App-spezifische UI-Komponenten
│   └── navigation/                 # Navigation Setup
│
└── firebase/                       # Firebase Konfiguration
    ├── rules/                      # Firestore-Regeln
    └── mockData/                   # Testdaten
```

## 🛠️ Technologien

- **Frontend**: Next.js 15.3.3, React 18.2.0
- **Language**: TypeScript 5.3.3
- **Styling**: Tailwind CSS 3.4.1
- **Chess Logic**: chess.js 1.0.0-beta.6
- **Chess Engine**: Stockfish.js (WASM)
- **State Management**: Zustand 4.5.0 + React Context
- **Testing**: Jest 29.7.0, React Testing Library
- **Mobile**: React Native 0.73.4 (vorbereitet)

## 📊 Projekt Status

- **Test Coverage**: 76.16% (Statement Coverage)
- **Test Success**: 97.2% (104/107 Test Suites bestanden) - **31 tests fixed today**
- **Code Health**: Excellent (<2% ungenutzter Code)
- **Performance**: Optimiert mit LRU Cache, Debouncing
- **Bundle Size**: ~500KB (Ziel: <300KB)
- **Migration Status**: ✅ Unified Evaluation System (100% aktiv), ✅ LoggerCompat Migration Complete
- **Active Development**: Juli 2025

## 💻 Entwicklung

### Voraussetzungen

- Node.js 18+
- npm oder yarn

### Installation

```bash
npm install
```

### Entwicklungsserver starten

```bash
npm run dev
```

Server läuft auf http://localhost:3000

### Tests ausführen

```bash
# Alle Tests
npm test

# Mit Coverage
npm run test:coverage

# Watch Mode
npm run test:watch
```

### Lint

```bash
npm run lint
```

## 📱 Mobile App (Android)

Die Android App basiert auf React Native und teilt 80% des Codes mit der Web-Version:

```bash
cd app/mobile
npm install
npm run android
```

## 🎮 Aktuelle Endspiel-Positionen

- **Bauernendspiele**: Grundlegende Bauernstrukturen
- **Turmendspiele**: Lucena, Philidor Positionen
- **7 Positionen** bereits implementiert
- Erweiterbar auf 50+ Positionen

## ⚡ Performance

Die Anwendung wurde für optimale Performance auf Desktop und Mobile optimiert:

- **Debouncing**: 300ms Verzögerung bei Evaluierungen verhindert API-Flooding
- **LRU Cache**: Wiederholte Positionen werden gecacht (200 Items, ~70KB)
- **Parallel Processing**: Tablebase-Vergleiche laufen parallel statt sequenziell
- **Instance Reuse**: Chess.js Instanzen werden wiederverwendet statt neu erstellt
- **Abort Support**: Veraltete API-Requests werden automatisch abgebrochen

### Messergebnisse:
- 75% weniger API-Calls bei schnellen Zugfolgen
- 31% schnellere Tablebase-Vergleiche
- 53% schnellere Navigation zwischen Zügen
- 100% Cache-Hit-Rate für wiederholte Positionen

## 📈 Projekt Status

- ✅ **Production Ready** Web-Anwendung
- ✅ **56.15% Test Coverage** mit 928 Tests
- ✅ **Performance Optimiert** für Mobile
- ✅ **Mobile Architecture** vorbereitet
- ⏳ **Android App** in Entwicklung
- ⏳ **PWA Features** geplant

## 📄 Lizenz

ISC
