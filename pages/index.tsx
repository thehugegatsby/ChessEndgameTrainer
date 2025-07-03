import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@shared/components/layout/AppLayout';

// Brückenbau-Trainer Lektionen (Inkrementell von fast gewonnen zu schwieriger)
const bridgeTrainerLessons = [
  {
    id: 'schritt-1-zickzack',
    trainId: 9, // Neue ID für erste Lektion
    title: 'Schritt 1: Zickzack laufen',
    description: 'König läuft im Zickzack nach vorne, Turm schützt von hinten',
    fen: '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1',
    difficulty: 'beginner' as const,
    icon: '⚡',
    step: 1,
    learningGoals: [
      'König im Zickzack nach vorne bewegen (Kd7-Kc6-Kb5)',
      'Turm als Schutzschild von hinten',
      'Sichere Bauernumwandlung erreichen'
    ],
    keyMoves: ['Kd7', 'Kc6', 'Kb5'],
    lichessUrl: 'https://lichess.org/analysis/2K5/2P2k2/8/8/4R3/8/1r6/8_w_-_-_0_1?color=white',
    completed: false
  },
  {
    id: 'schritt-2-turm-positionieren',
    trainId: 10, // Neue ID für zweite Lektion
    title: 'Schritt 2: Turm positionieren',
    description: 'Turm erst auf die 4. oder 5. Reihe bringen, dann Brücke bauen',
    fen: '2K2k2/2P5/8/8/8/8/1r6/4R3 w - - 0 1',
    difficulty: 'beginner' as const,
    icon: '🏗️',
    step: 2,
    learningGoals: [
      'Turm auf 4. oder 5. Reihe positionieren',
      'Optimale Turmposition für Brückenbau finden',
      'Dann wie Schritt 1 fortfahren'
    ],
    keyMoves: ['Re4', 'Re5', 'dann Kd7'],
    lichessUrl: 'https://lichess.org/analysis/2K2k2/2P5/8/8/8/8/1r6/4R3_w_-_-_0_1?color=white',
    completed: false
  },
  {
    id: 'schritt-3-koenig-abdraengen',
    trainId: 11, // Neue ID für dritte Lektion
    title: 'Schritt 3: Gegnerischen König abdrängen',
    description: 'König steht noch zentral - erst abdrängen, dann Brücke bauen',
    fen: '2K1k3/2P5/8/8/8/8/1r6/7R w - - 0 1',
    difficulty: 'intermediate' as const,
    icon: '🎯',
    step: 3,
    learningGoals: [
      'Gegnerischen König von der Mitte abdrängen',
      'Turm optimal positionieren für Abdrängen',
      'Dann Brückenbau-Technik anwenden'
    ],
    keyMoves: ['Re1+', 'Kf8', 'Re4'],
    lichessUrl: 'https://lichess.org/analysis/2K1k3/2P5/8/8/8/8/1r6/7R_w_-_-_0_1?color=white',
    completed: false
  }
];

export default function HomePage() {
  return (
    <AppLayout>
      <main className="px-4 md:px-6 max-w-6xl mx-auto">
        {/* Hero Section - Brückenbau-Trainer */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            🌉 Brückenbau-Trainer
          </h1>
          <p className="text-lg lg:text-xl mb-6 lg:mb-8 px-4" style={{ color: 'var(--text-secondary)' }}>
            Erweiterte Zugbewertung für strukturiertes Endspiel-Training
          </p>
          <p className="text-sm lg:text-base mb-6 px-4" style={{ color: 'var(--text-muted)' }}>
            Lerne die fundamentalen Brückenbau-Techniken mit 5-stufiger Qualitätsklassifikation
          </p>
          
          {/* Start-Button */}
          <div className="flex justify-center px-4">
            <Link 
              href="/train/9"
              className="px-8 py-4 dark-button-success rounded-xl font-semibold hover:bg-green-600 transition-colors text-center"
            >
              🚀 Brückenbau-Training starten
            </Link>
          </div>
        </div>

        {/* Brückenbau-Lektionen Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-12">
          {bridgeTrainerLessons.map(lesson => (
            <div key={lesson.id} className="dark-card-elevated rounded-2xl p-4 lg:p-6 relative">
              {/* Schritt-Nummer Badge */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {lesson.step}
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl lg:text-3xl">
                  {lesson.icon}
                </span>
                <h2 className="text-lg lg:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {lesson.title}
                </h2>
              </div>
              
              <p className="mb-4 text-sm lg:text-base" style={{ color: 'var(--text-secondary)' }}>
                {lesson.description}
              </p>

              {/* Learning Goals */}
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Lernziele:</h4>
                <ul className="space-y-1">
                  {lesson.learningGoals.map((goal, index) => (
                    <li key={index} className="text-xs lg:text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Moves */}
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Schlüsselzüge:</h4>
                <div className="flex flex-wrap gap-1">
                  {lesson.keyMoves.map((move, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-mono"
                    >
                      {move}
                    </span>
                  ))}
                </div>
              </div>

              {/* Difficulty Badge */}
              <div className="mb-4">
                <span className={`text-xs px-2 py-1 rounded ${
                  lesson.difficulty === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  lesson.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {lesson.difficulty === 'beginner' ? 'Anfänger' :
                   lesson.difficulty === 'intermediate' ? 'Fortgeschritten' : 'Experte'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Link 
                  href={`/train/${lesson.trainId}`}
                  className="w-full dark-button-success px-4 py-3 rounded-lg hover:bg-green-600 transition-colors text-center font-semibold"
                >
                  🎯 Training starten
                </Link>
                
                {lesson.lichessUrl && (
                  <a 
                    href={lesson.lichessUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full dark-button-primary px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-center text-sm"
                  >
                    📊 Lichess-Analyse öffnen
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Brückenbau-Trainer Konzept */}
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-xl lg:text-2xl font-bold mb-6 lg:mb-8" style={{ color: 'var(--text-primary)' }}>
            🌉 Das Brückenbau-Konzept
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center p-4 dark-card rounded-lg">
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">🎯</div>
              <h3 className="text-base lg:text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                5-Stufige Bewertung
              </h3>
              <p className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
                🟢 Optimal, ✅ Sicher, 🟡 Umweg, ⚠️ Riskant, 🚨 Fehler
              </p>
            </div>
            
            <div className="text-center p-4 dark-card rounded-lg">
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">📈</div>
              <h3 className="text-base lg:text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Inkrementeller Aufbau
              </h3>
              <p className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Von fast gewonnen zu komplexer - Schritt für Schritt lernen
              </p>
            </div>
            
            <div className="text-center p-4 dark-card rounded-lg">
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">🛡️</div>
              <h3 className="text-base lg:text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Sicher vor Perfekt
              </h3>
              <p className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Zuverlässige Technik wird höher bewertet als riskante Perfektion
              </p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-12">
          <div className="dark-card-elevated rounded-lg p-4 lg:p-6 text-center">
            <div className="text-2xl lg:text-3xl mb-2">🎓</div>
            <div className="text-xl lg:text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {bridgeTrainerLessons.length}
            </div>
            <div className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
              Lektionen verfügbar
            </div>
          </div>

          <div className="dark-card-elevated rounded-lg p-4 lg:p-6 text-center">
            <div className="text-2xl lg:text-3xl mb-2">🌉</div>
            <div className="text-xl lg:text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Pilot
            </div>
            <div className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
              Beta-Version
            </div>
          </div>

          <div className="dark-card-elevated rounded-lg p-4 lg:p-6 text-center">
            <div className="text-2xl lg:text-3xl mb-2">⚡</div>
            <div className="text-xl lg:text-2xl font-bold mb-1" style={{ color: 'var(--success-text)' }}>
              Live
            </div>
            <div className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sofort verfügbar
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
} 