# ChessEndgameTrainer

Eine moderne Web- und Mobile-Anwendung zum Lernen von Schachendspielen.

## 🎯 Features

- **Interaktives Schachbrett** für Endspielübungen
- **Stockfish Engine Integration** für perfekte Analyse
- **Dual Evaluation System** (Engine + Tablebase)
- **Spaced Repetition System** (FSRS) für optimiertes Lernen
- **Fortschrittsverfolgung** und Statistiken
- **Responsive Design** für Desktop und Mobile
- **Cross-Platform Ready** - Web und Android App
- **Dark Mode** Support
- **52.86% Test Coverage** mit 612 Tests

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

## 📈 Projekt Status

- ✅ **Production Ready** Web-Anwendung
- ✅ **52.86% Test Coverage** mit 612 Tests
- ✅ **Mobile Architecture** vorbereitet
- ⏳ **Android App** in Entwicklung
- ⏳ **PWA Features** geplant

## 📄 Lizenz

ISC
