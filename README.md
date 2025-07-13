# Chess Endgame Trainer 🎯

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/Coverage-~78%25-green)](./coverage/lcov-report/index.html)
[![CI/CD](https://github.com/thehugegatsby/ChessEndgameTrainer/actions/workflows/test-and-coverage.yml/badge.svg)](https://github.com/thehugegatsby/ChessEndgameTrainer/actions)
[![Deployment Ready](https://img.shields.io/badge/Deployment-Ready-green)](./docs/deployment/DEPLOYMENT_GUIDE.md)

Eine moderne Web- und Mobile-Anwendung zum systematischen Lernen von Schachendspielen mit KI-Unterstützung.

## 🎯 Features

- **13 Endspiel-Positionen** - Von Bauern bis Turmendspiele
- **Stockfish Engine Integration** - WASM-basierte KI-Analyse
- **Unified Evaluation System** - Moderne, konsistente Bewertungslogik
- **Dual Evaluation Display** - Engine + Lichess Tablebase
- **Best Moves Display** - Top 3 Züge mit Bewertungen (Lichess-Style)
- **Brückenbau-Trainer** - Strukturiertes Lernen mit 5 Lektionen
- **Spaced Repetition** - FSRS-basiertes Lernsystem
- **Performance Optimiert** - 75% weniger API-Calls, LRU Cache
- **Database Ready** - Firestore migration mit Dual-Read Pattern
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
│   ├── utils/                      # Utility Functions
│   │   └── chess/                  # Chess-specific utilities
│   │       └── evaluation/         # Modular evaluation logic
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
- **State Management**: Zustand 4.5.0 (Single Source of Truth)
- **Testing**: Jest 29.7.0, React Testing Library
- **Mobile**: React Native 0.73.4 (vorbereitet)

## 📊 Projekt Status

- **Test Coverage**: ~78% (Business Logic) / ~47% (Overall) - Ziel: 80% Business Logic
- **Test Success**: 99% (1023/1034 Tests bestanden, 11 skipped)
- **Code Health**: Excellent (<2% ungenutzter Code)
- **Architecture**: ✅ Modular evaluation system with clean re-exports
- **Error Handling**: ✅ Centralized ErrorService + Logger Architecture
- **State Management**: ✅ Vollständig auf Zustand migriert (Store of Truth)
- **Security**: ✅ FEN Input Sanitization implementiert
- **Performance**: Optimiert mit LRU Cache, Debouncing, Tree-Shaking
- **Migration Status**: ✅ Store of Truth Complete, ✅ Hooks deprecated
- **Active Development**: Januar 2025

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

Server läuft auf http://localhost:3002

### Database Migration (Optional)

```bash
# Test migration without writing
npm run migrate:firestore -- --dry-run

# Run actual migration to Firestore
npm run migrate:firestore

# Verify migration
npm run migrate:verify
```

Details siehe [Firestore Migration Guide](./docs/database/FIRESTORE_MIGRATION_README.md)

### Tests ausführen

```bash
# Unit Tests
npm test

# Mit Coverage
npm run test:coverage

# Watch Mode
npm run test:watch

# E2E Tests mit Playwright
npm run test:e2e

# Smoke Tests
npx playwright test --grep "@smoke"
```

#### E2E Test-Konfiguration
E2E Tests nutzen MockEngineService für sofortige Antworten:

```bash
# Dev-Server starten
npm run dev

# Tests ausführen
npm run test:e2e
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

- **Smart Engine Management**: Ein Engine-Instance für die gesamte App
- **LRU Cache**: Intelligentes Caching für wiederholte Positionen
- **Debouncing**: Verhindert überflüssige Engine-Anfragen
- **75% weniger API-Calls** durch verschiedene Optimierungen

Detaillierte Performance-Metriken und technische Details finden Sie in der [ARCHITECTURE.md](docs/ARCHITECTURE.md#performance-optimizations).

## 📈 Projekt Status

- ✅ **Production Ready** Web-Anwendung
- ✅ **Phase 0 & 1 Complete** Test Infrastructure + Engine Foundation
- ✅ **~78% Test Coverage** mit 47 bestehenden Tests
- ✅ **ChessEngine Infrastructure** Ready for consolidation
- ✅ **Clean Architecture** TestFixtures vs TestScenarios separation
- ✅ **FEN Validation** All positions validated and corrected
- ✅ **Expert-Guided Cleanup** Gemini Pro + O3 consensus approach
- ✅ **Store of Truth** Migration vollständig abgeschlossen  
- ✅ **Security** FEN Sanitization implementiert
- ✅ **Performance Optimiert** für Mobile & Tree-Shaking
- ✅ **Quality Gates** All passing (lint, TypeScript, tests, build)
- 🚀 **Phase 2 Ready** ENGINE CONSOLIDATION EXECUTION
- ⏳ **ScenarioEngine Migration** to ChessEngine (Phase 2)
- ⏳ **Type System Simplification** (Phase 3)
- ⏳ **Firebase Direct Integration** (Phase 4)

## 📚 Dokumentation

Die vollständige Dokumentation ist strukturiert organisiert:

- **[CLAUDE.md](./CLAUDE.md)** - AI Assistant Context & Best Practices
- **[Architecture](./docs/ARCHITECTURE.md)** - Systemarchitektur und Design
- **[Security](./docs/SECURITY.md)** - Security Guidelines und Implementation
- **[Testing](./docs/TESTING.md)** - Umfassende Test-Strategie
- **[Database Migration](./docs/database/FIRESTORE_MIGRATION_README.md)** - Firestore Migration Guide
- **[Deployment](./docs/deployment/DEPLOYMENT_GUIDE.md)** - Production Deployment Guide

## 📄 Lizenz

ISC
