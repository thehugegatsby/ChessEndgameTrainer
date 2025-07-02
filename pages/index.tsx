import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@shared/components/layout/AppLayout';
import { endgameCategories } from '@shared/data/endgames/index';

export default function HomePage() {
  return (
    <AppLayout>
      <main className="px-4 md:px-6 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            🏆 Endspiel Training
          </h1>
          <p className="text-lg lg:text-xl mb-6 lg:mb-8 px-4" style={{ color: 'var(--text-secondary)' }}>
            Meistere die wichtigsten Endspiele und verbessere dein Spiel
          </p>
          
          {/* Mobile-optimized buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 lg:gap-4 px-4">
            <Link 
              href="/dashboard"
              className="px-6 py-3 dark-button-primary rounded-xl font-semibold hover:bg-blue-600 transition-colors text-center"
            >
              📊 Dashboard
            </Link>
            <Link 
              href="/train/1"
              className="px-6 py-3 dark-button-success rounded-xl font-semibold hover:bg-green-600 transition-colors text-center"
            >
              🚀 Training starten
            </Link>
          </div>
        </div>

        {/* Categories Grid - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
          {endgameCategories.map(category => (
            <div key={category.id} className="dark-card-elevated rounded-2xl p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl lg:text-3xl">
                  {category.id === 'pawn' ? '👑' : '🏰'}
                </span>
                <h2 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {category.name}
                </h2>
              </div>
              
              <p className="mb-4 lg:mb-6 text-sm lg:text-base" style={{ color: 'var(--text-secondary)' }}>
                {category.description}
              </p>

              {/* Position List - Mobile optimized */}
              <div className="space-y-2 lg:space-y-3 mb-4 lg:mb-6">
                {category.positions.map(position => (
                  <Link 
                    key={position.id}
                    href={`/train/${position.id}`}
                    className="block p-3 lg:p-4 dark-card rounded-lg hover:bg-gray-600 transition-colors active:bg-gray-500"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                        <span className="text-sm lg:text-lg font-mono text-gray-400 flex-shrink-0">
                          #{position.id}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm lg:text-base truncate" style={{ color: 'var(--text-primary)' }}>
                            {position.title}
                          </h3>
                          <p className="text-xs lg:text-sm truncate lg:block" style={{ color: 'var(--text-secondary)' }}>
                            {position.description.substring(0, 40)}...
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                        <span className={`text-xs px-1.5 lg:px-2 py-1 rounded ${
                          position.difficulty === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          position.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {position.difficulty}
                        </span>
                        <span className="text-base lg:text-lg">
                          {position.goal === 'win' ? '🏆' : position.goal === 'draw' ? '🤝' : '🛡️'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Category Summary */}
              <div className="flex items-center justify-between text-xs lg:text-sm" style={{ color: 'var(--text-muted)' }}>
                <span>{category.positions.length} Stellungen</span>
                <Link 
                  href={`/train/${category.positions[0]?.id || 1}`}
                  className="dark-button-primary px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-xs lg:text-sm"
                >
                  Beginnen →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats - Mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-12">
          <div className="dark-card-elevated rounded-lg p-4 lg:p-6 text-center">
            <div className="text-2xl lg:text-3xl mb-2">📚</div>
            <div className="text-xl lg:text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {endgameCategories.reduce((total, cat) => total + cat.positions.length, 0)}
            </div>
            <div className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
              Stellungen verfügbar
            </div>
          </div>

          <div className="dark-card-elevated rounded-lg p-4 lg:p-6 text-center">
            <div className="text-2xl lg:text-3xl mb-2">🎯</div>
            <div className="text-xl lg:text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {endgameCategories.length}
            </div>
            <div className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
              Kategorien
            </div>
          </div>

          <div className="dark-card-elevated rounded-lg p-4 lg:p-6 text-center">
            <div className="text-2xl lg:text-3xl mb-2">⚡</div>
            <div className="text-xl lg:text-2xl font-bold mb-1" style={{ color: 'var(--success-text)' }}>
              98.3%
            </div>
            <div className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
              Verfügbarkeit
            </div>
          </div>
        </div>

        {/* Features - Mobile optimized */}
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-xl lg:text-2xl font-bold mb-6 lg:mb-8" style={{ color: 'var(--text-primary)' }}>
            ✨ Features
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center p-4 dark-card rounded-lg sm:dark-card-transparent sm:p-0">
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">🧠</div>
              <h3 className="text-base lg:text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                KI-Engine Analyse
              </h3>
              <p className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Stockfish-Engine bewertet jeden Zug und zeigt Fehler sofort an
              </p>
            </div>
            
            <div className="text-center p-4 dark-card rounded-lg sm:dark-card-transparent sm:p-0">
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">📊</div>
              <h3 className="text-base lg:text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Fortschritts-Tracking
              </h3>
              <p className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Detaillierte Statistiken und Spaced-Repetition System
              </p>
            </div>
            
            <div className="text-center p-4 dark-card rounded-lg sm:dark-card-transparent sm:p-0">
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">🔗</div>
              <h3 className="text-base lg:text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Lichess Integration
              </h3>
              <p className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Direkte Links zur Lichess-Analyse für jede Stellung
              </p>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
} 