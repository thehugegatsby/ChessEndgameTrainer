# Endgame Book

Eine moderne Web- und Mobile-Anwendung zum Lernen von Schachendspielen.

## Projektstruktur

```
endgamebook/
├── app/
│   ├── web/                         # Next.js Web-App
│   │   ├── pages/                   # Seitenrouten
│   │   ├── components/              # Web-spezifische UI-Komponenten
│   │   ├── styles/                  # Tailwind Setup & globale Styles
│   │   └── tests/                   # Web-Komponenten-Tests
│   ├── mobile/                      # Expo React Native App (später)
│   │   ├── screens/                 # App Screens
│   │   ├── components/              # App-spezifische UI-Komponenten
│   │   ├── navigation/              # Navigation (Stack, Tab, etc.)
│   │   └── tests/                   # Mobile-Komponenten-Tests
│
├── shared/                         # Geteilte Logik für Web + App
│   ├── components/                 # Wiederverwendbare UI-Komponenten
│   ├── hooks/                      # Gemeinsame React Hooks
│   ├── lib/                        # Services, chess.js wrapper, Firebase
│   ├── data/                       # Endspielkarten (FEN, Ziel, Lösung)
│   ├── types/                      # Globale Typdefinitionen
│   ├── utils/                      # Hilfsfunktionen
│   └── tests/                      # Unit-Tests
│
├── firebase/                       # Firebase Konfiguration
│   ├── rules/                      # Firestore-Regeln
│   └── mockData/                   # Testdaten
```

## Entwicklung

### Voraussetzungen

- Node.js 18+
- npm oder yarn
- Firebase CLI (für Firebase-Funktionen)

### Installation

```bash
npm install
```

### Entwicklungsserver starten

```bash
npm run dev
```

### Tests ausführen

```bash
npm test
```

## Technologien

- Next.js für die Web-App
- React Native (Expo) für die Mobile-App
- TypeScript
- Tailwind CSS
- Firebase (Authentication, Firestore)
- Jest für Tests

## Features

- Interaktives Schachbrett für Endspielübungen
- Spaced Repetition System (FSRS) für optimiertes Lernen
- Fortschrittsverfolgung und Statistiken
- Responsive Design für Desktop und Mobile
- Offline-Funktionalität

## Lizenz

ISC 