/**
 * CURSOR PROJECT CONFIGURATION
 * 
 * WICHTIG: ALLE Details sind in SESSION_START.md!
 * Diese Datei enthält nur die Basis-Konfiguration.
 */

export const cursorProjectConfig = {
  name: "Chess Training App",
  description: "Spaced-Repetition-Tool für Endspieltraining - Web & Mobile",
  
  // 🚨 HAUPTREFERENZ - LESEN SIE DIES ZUERST!
  mainDocumentation: "SESSION_START.md",
  
  // 🧠 KRITISCHE ERINNERUNGEN (aus SESSION_START.md)
  criticalReminders: [
    "🚨 ERSTE AKTION: SESSION_START.md lesen für kompletten Kontext!",
    "🧠 ENGINE-BEWERTUNG: Immer aus Sicht der ziehenden Seite - bei Schwarz negieren!",
    "🔥 BUILD-PROBLEME: rm -rf .next && npm run dev",
    "🎯 MOBILE-READY: Android-Deployment vorbereitet, Capacitor-kompatibel"
  ],
  
  // 🎯 AKTUELLER PROJECT STATUS
  currentStatus: {
    phase: "Production-Ready - Final Polish",
    buildStatus: "Needs cleanup (build cache corruption)",
    mobileStatus: "Android-ready",
    architecture: "Modular refactoring complete (75% code reduction)"
  },
  
  // ⚡ QUICK COMMANDS (Details in SESSION_START.md)
  quickCommands: {
    fixBuild: "rm -rf .next && npm run dev",
    restart: "Stop-Process -Name node -Force && npm run dev", 
    typeCheck: "npx tsc --noEmit",
    dev: "npm run dev",
    test: "npm test"
  },
  
  // 🗂️ CRITICAL FILES (vollständige Liste in SESSION_START.md)
  criticalFiles: {
    sessionStart: "SESSION_START.md",  // 🚨 MAIN REFERENCE!
    mainTraining: "pages/train/[id].tsx",
    newTrainingBoard: "shared/components/training/TrainingBoard/index.tsx",
    evaluationService: "shared/lib/chess/ScenarioEngine/evaluationService.ts",
    legacyToDelete: "shared/components/training/TrainingBoard.tsx"
  },
  
  principles: [
    "📖 SINGLE SOURCE OF TRUTH: Alle Informationen in SESSION_START.md",
    "🧠 ENGINE-PERSPECTIVE: Engine gibt Bewertung aus Sicht der ziehenden Seite zurück",
    "🚀 BUILD-FIRST: Bei Problemen immer .next Cache löschen",
    "📱 MOBILE-FIRST: Responsive Design und Touch-Optimierung",
    "🎯 MODULAR: Komponenten klein halten, Hooks verwenden",
    "⚡ PERFORMANCE: React.memo und Memory-Management für Mobile"
  ]
}; 