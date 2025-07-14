import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@shared/components/layout/AppLayout';
import { TEST_IDS, getTestId } from '@shared/constants/testIds';

// Brückenbau-Trainer Lektionen (Inkrementell von fast gewonnen zu schwieriger)
const bridgeTrainerLessons = [
  {
    id: 'schritt-1-zickzack',
    trainId: 12,
    title: 'Zickzack-Technik',
    description: 'König läuft im Zickzack nach vorne, Turm schützt von hinten',
    fen: '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1',
    difficulty: 'beginner' as const,
    step: 1,
    keyMoves: ['Kd7', 'Kc6', 'Kb5'],
    lichessUrl: 'https://lichess.org/analysis/2K5/2P2k2/8/8/4R3/8/1r6/8_w_-_-_0_1?color=white',
  },
  {
    id: 'schritt-2-turm-positionieren',
    trainId: 13,
    title: 'Turm positionieren',
    description: 'Turm erst auf die 4. oder 5. Reihe bringen, dann Brücke bauen',
    fen: '2K2k2/2P5/8/8/8/8/1r6/4R3 w - - 0 1',
    difficulty: 'beginner' as const,
    step: 2,
    keyMoves: ['Re4', 'Re5', 'Kd7'],
    lichessUrl: 'https://lichess.org/analysis/2K2k2/2P5/8/8/8/8/1r6/4R3_w_-_-_0_1?color=white',
  },
  {
    id: 'schritt-3-koenig-abdraengen',
    trainId: 14,
    title: 'König abdrängen',
    description: 'König steht noch zentral - erst abdrängen, dann Brücke bauen',
    fen: '2K1k3/2P5/8/8/8/8/1r6/7R w - - 0 1',
    difficulty: 'intermediate' as const,
    step: 3,
    keyMoves: ['Re1+', 'Kf8', 'Re4'],
    lichessUrl: 'https://lichess.org/analysis/2K1k3/2P5/8/8/8/8/1r6/7R_w_-_-_0_1?color=white',
  }
];

export default function HomePage() {
  return (
    <AppLayout>
      <main className="px-4 md:px-6 max-w-6xl mx-auto">
        {/* Hero Section - Brückenbau-Trainer */}
        <div className="text-center mb-12 lg:mb-16 pt-8">
          <h1 className="text-4xl lg:text-5xl font-light mb-4" style={{ color: 'var(--text-primary)' }}>
            Brückenbau-Trainer
          </h1>
          <p className="text-lg lg:text-xl mb-8 font-light" style={{ color: 'var(--text-secondary)' }}>
            Meistere Turmendspiele mit systematischem Training
          </p>
          
          {/* Start-Button */}
          <div className="flex justify-center">
            <Link 
              href="/train/12"
              data-testid={TEST_IDS.NAVIGATION.TRAINING_LINK}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Training starten
            </Link>
          </div>
        </div>

        {/* Lektionen */}
        <div className="mb-16">
          <h2 className="text-2xl font-light mb-8 text-center" style={{ color: 'var(--text-primary)' }}>
            Lektionen
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {bridgeTrainerLessons.map(lesson => (
              <div key={lesson.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-blue-600 dark:hover:border-blue-500 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                    {lesson.title}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Lektion {lesson.step}
                  </span>
                </div>
                
                <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {lesson.description}
                </p>

                {/* Key Moves */}
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Schlüsselzüge
                  </p>
                  <div className="flex gap-2">
                    {lesson.keyMoves.map((move, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
                      >
                        {move}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Link 
                    href={`/train/${lesson.trainId}`}
                    data-testid={getTestId(TEST_IDS.LESSONS.START_BUTTON, lesson.trainId)}
                    className="block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center text-sm font-medium"
                  >
                    Starten
                  </Link>
                  
                  {lesson.lichessUrl && (
                    <a 
                      href={lesson.lichessUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:border-blue-600 dark:hover:border-blue-500 transition-colors text-center text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Auf Lichess analysieren
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Methodik */}
        <div className="mb-16">
          <h2 className="text-2xl font-light mb-8 text-center" style={{ color: 'var(--text-primary)' }}>
            Methodik
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Präzise Bewertung
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                5-stufige Qualitätsklassifikation für jeden Zug
              </p>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Systematisches Lernen
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Aufbauende Lektionen vom Einfachen zum Komplexen
              </p>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Sichere Technik
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Fokus auf zuverlässige Gewinnführung
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer Space */}
        <div className="pb-16"></div>
      </main>
    </AppLayout>
  );
} 