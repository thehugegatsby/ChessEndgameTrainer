import React from 'react';

export const WikiPanel: React.FC = () => {
  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {/* Info Card */}
      <div className="dark-card rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📚</span>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Bauernendspiel: Opposition
          </h2>
        </div>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          Die Opposition ist ein fundamentales Konzept in Bauernendspielen. Der Spieler hat die Opposition, 
          wenn sein König dem gegnerischen König direkt gegenübersteht mit einem Feld dazwischen.
        </p>
        
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>🎯 Ziel:</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Erreiche die Opposition und führe den Bauern zum Damenfeld.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>💡 Tipp:</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Ziehe deinen König vorwärts, um Raum zu gewinnen, aber achte darauf, 
              die Opposition nicht zu verlieren.
            </p>
          </div>
        </div>
      </div>

      {/* Strategy Card */}
      <div className="dark-card rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚡</span>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Strategie
          </h3>
        </div>
        
        <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>König vor den Bauern bringen</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Opposition erhalten oder erobern</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Gegnerischen König abdrängen</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">✗</span>
            <span>Bauern zu früh vorschieben</span>
          </div>
        </div>
      </div>

      {/* Key Squares Card */}
      <div className="dark-card rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔲</span>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Schlüsselfelder
          </h3>
        </div>
        
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          <p className="mb-2">
            Die Felder d6, e6, f6 sind kritisch für Weiß. Erreicht der weiße König 
            eines dieser Felder, ist der Gewinn garantiert.
          </p>
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="dark-card-elevated p-1 rounded text-xs font-mono">d6</div>
            <div className="dark-card-elevated p-1 rounded text-xs font-mono">e6</div>
            <div className="dark-card-elevated p-1 rounded text-xs font-mono">f6</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 