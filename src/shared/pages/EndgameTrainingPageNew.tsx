/**
 * @file Main training page component (NEW ARCHITECTURE)
 * @module pages/EndgameTrainingPage
 * 
 * Clean implementation using the new architecture
 */

'use client';

import React, { useState } from 'react';
import { TrainingBoard } from '../components/training/TrainingBoard/TrainingBoardNew';

interface EndgameTrainingPageProps {
  initialCategory?: string;
}

export default function EndgameTrainingPage({ 
  initialCategory = 'pawn' 
}: EndgameTrainingPageProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sessionCount, setSessionCount] = useState(0);
  
  const categories = [
    { id: 'pawn', name: 'Bauernendspiele', icon: '♟' },
    { id: 'rook', name: 'Turmendspiele', icon: '♜' },
    { id: 'queen', name: 'Damenendspiele', icon: '♛' },
    { id: 'minor', name: 'Leichtfigurenendspiele', icon: '♞' },
    { id: 'mixed', name: 'Gemischte Endspiele', icon: '♔' }
  ];
  
  const handleSessionComplete = () => {
    setSessionCount(prev => prev + 1);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Chess Endgame Trainer
          </h1>
          <p className="text-gray-600">
            Meistere Schachendspiele mit Tablebase-Analyse
          </p>
        </header>
        
        {/* Category Selection */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Kategorie wählen</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  px-4 py-3 rounded-lg border-2 transition-all
                  ${selectedCategory === cat.id 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                  }
                `}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="text-sm font-medium">{cat.name}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Training Board */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <TrainingBoard 
                category={selectedCategory}
                onSessionComplete={handleSessionComplete}
                boardSize={typeof window !== 'undefined' ? Math.min(600, window.innerWidth - 100) : 600}
              />
            </div>
          </div>
          
          {/* Side Panel */}
          <div className="space-y-6">
            {/* Session Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Session Statistik</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Positionen gespielt:</span>
                  <span className="font-medium">{sessionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Aktuelle Kategorie:</span>
                  <span className="font-medium">
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Tips */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Tipps</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Klicke auf eine Figur und dann auf das Zielfeld um zu ziehen</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Drag & Drop ist auch möglich</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Die Tablebase zeigt dir den perfekten Zug</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Versuche, die beste Fortsetzung zu finden</span>
                </li>
              </ul>
            </div>
            
            {/* Legend */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Legende</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-200 rounded mr-2"></div>
                  <span>Mögliche Züge</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-200 rounded mr-2"></div>
                  <span>Ausgewählte Figur</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-200 rounded mr-2"></div>
                  <span>Letzter Zug</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}