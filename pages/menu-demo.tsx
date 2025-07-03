import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@shared/components/layout/Header';
import { AdvancedEndgameMenu } from '@shared/components/navigation/AdvancedEndgameMenu';

export default function MenuDemo() {
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header />
      
      <div className="flex pt-16">
        {/* Advanced Menu */}
        <AdvancedEndgameMenu 
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          currentPositionId={1}
        />
        
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
              </button>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Advanced Endgame Menu Demo
              </h1>
            </div>
            
            <div className="space-y-6">
              <div className="dark-card-elevated rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  🎯 Menu Features
                </h2>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <li>✅ <strong>Material-basierte Kategorisierung:</strong> K+P vs K, K+R+P vs K+R, etc.</li>
                  <li>✅ <strong>Expandable Kategorien:</strong> Bauernendspiele, Turmendspiele</li>
                  <li>✅ <strong>User Rating System:</strong> Rating 1,123 (customizable)</li>
                  <li>✅ <strong>Responsive Design:</strong> Mobile-friendly mit Backdrop</li>
                  <li>✅ <strong>Future Categories:</strong> Dame, Springer, Läufer (vorbereitet)</li>
                  <li>✅ <strong>Position Counter:</strong> Anzahl Stellungen pro Subkategorie</li>
                </ul>
              </div>

              <div className="dark-card-elevated rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  📊 Current Data Structure
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Bauernendspiele (♙)
                    </h3>
                    <ul className="space-y-1" style={{ color: 'var(--text-secondary)' }}>
                      <li>• K+P vs K (3 Stellungen)</li>
                      <li>• K+2P vs K+P (1 Stellung)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Turmendspiele (♜)
                    </h3>
                    <ul className="space-y-1" style={{ color: 'var(--text-secondary)' }}>
                      <li>• K+R+P vs K+R (3 Stellungen)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="dark-card-elevated rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  🚀 Next Steps
                </h2>
                <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">1.</span>
                    <span><strong>Test Menu Navigation:</strong> Klicke durch die Kategorien und Subkategorien</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400">2.</span>
                    <span><strong>Add More Positions:</strong> Erweitere die Stellungssammlung</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400">3.</span>
                    <span><strong>Integrate into Dashboard:</strong> Integriere das Menü in die Hauptseiten</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-400">4.</span>
                    <span><strong>Add Future Categories:</strong> Dame-, Springer-, Läufer-Endspiele</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="inline-flex gap-4">
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📊 Zurück zum Dashboard
                  </Link>
                  <Link
                    href="/train/1"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    🚀 Training starten
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 