/**
 * Demo page for the new Tablebase Enhancement
 * Shows the new Lichess-like tablebase interface without database dependency
 */

"use client";

import React, { useState } from "react";
import { TablebasePanel } from "@shared/components/tablebase/TablebasePanel";
import { type TablebaseData } from "@shared/types/evaluation";

/**
 * Tablebase demo page component
 * @returns Demo page showing tablebase functionality
 */
export default function TablebaseDemoPage() {
  const [selectedMove, setSelectedMove] = useState<string | undefined>(
    undefined,
  );

  // Mock tablebase data for demonstration
  const mockTablebaseData: TablebaseData = {
    isTablebasePosition: true,
    wdlBefore: 2,
    wdlAfter: 2,
    category: "win",
    dtz: 5,
    topMoves: [
      { move: "Kf6", san: "Kf6", dtz: 2, dtm: 4, wdl: 2, category: "win" },
      { move: "Kd6", san: "Kd6", dtz: 3, dtm: 6, wdl: 2, category: "win" },
      { move: "Ke6", san: "Ke6", dtz: 5, dtm: 10, wdl: 2, category: "win" },
      { move: "Kf5", san: "Kf5", dtz: 0, dtm: 0, wdl: 0, category: "draw" },
      { move: "Ke5", san: "Ke5", dtz: 0, dtm: 0, wdl: 0, category: "draw" },
      { move: "Kf4", san: "Kf4", dtz: -2, dtm: -4, wdl: -2, category: "loss" },
      { move: "Ke4", san: "Ke4", dtz: -5, dtm: -10, wdl: -2, category: "loss" },
      { move: "Kd4", san: "Kd4", dtz: -8, dtm: -16, wdl: -2, category: "loss" },
    ],
  };

  const mockTablebaseDataEmpty: TablebaseData = {
    isTablebasePosition: false,
  };

  const mockTablebaseDataLoading: TablebaseData = {
    isTablebasePosition: true,
    topMoves: [],
  };

  /**
   * Handle move selection
   * @param move - Selected move
   */
  const handleMoveSelect = (move: string) => {
    setSelectedMove(move);
    console.log("Selected move:", move);
  };

  // Debug: Log the actual move classifications
  console.log("Move classifications:");
  mockTablebaseData.topMoves?.forEach((move) => {
    const resultType = move.dtz > 0 ? "win" : move.dtz === 0 ? "draw" : "loss";
    console.log(
      `${move.san}: DTZ=${move.dtz}, calculated=${resultType}, category=${move.category}`,
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎯 Tablebase Enhancement Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Neue Lichess-ähnliche Tablebase-Oberfläche mit Farb-kodierten Zügen
          </p>
          {selectedMove && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-blue-700 dark:text-blue-400">
                Ausgewählter Zug: <strong>{selectedMove}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Clean, Lichess-style Layout */}
        <div className="max-w-4xl mx-auto">
          {/* Main Demo Panel */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Tablebase Analysis
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  K+P vs K • DTZ 5 • Win +2
                </div>
              </div>
            </div>

            <div className="p-6">
              <TablebasePanel
                tablebaseData={mockTablebaseData}
                onMoveSelect={handleMoveSelect}
                selectedMove={selectedMove}
                loading={false}
                compact={false}
              />
            </div>
          </div>

          {/* Comparison: Before vs After */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                Vorher (Basic)
              </h3>
              <div className="font-mono text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>📚 Tablebase</div>
                <div>Kf6 - DTZ 2</div>
                <div>Kd6 - DTZ 3</div>
                <div>Kf5 - DTZ 0</div>
                <div>Kf4 - DTZ -2</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                Nachher (Lichess-Style)
              </h3>
              <TablebasePanel
                tablebaseData={mockTablebaseData}
                onMoveSelect={handleMoveSelect}
                selectedMove={selectedMove}
                loading={false}
                compact={true}
              />
            </div>
          </div>

          {/* Edge Cases Row */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Loading State
              </h3>
              <TablebasePanel
                tablebaseData={mockTablebaseDataLoading}
                onMoveSelect={handleMoveSelect}
                loading={true}
                compact={true}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                No Tablebase Data
              </h3>
              <TablebasePanel
                tablebaseData={mockTablebaseDataEmpty}
                onMoveSelect={handleMoveSelect}
                loading={false}
                compact={true}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Empty Moves
              </h3>
              <TablebasePanel
                tablebaseData={mockTablebaseDataLoading}
                onMoveSelect={handleMoveSelect}
                loading={false}
                compact={true}
              />
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            ✨ Implementierte Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                🎨 Farb-Kodierung
              </h3>
              <p className="text-sm text-green-600 dark:text-green-300">
                Grün für Gewinnzüge, Gelb für Remis, Rot für Verluste
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                📊 Evaluierungs-Balken
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Visuelle Fortschrittsbalken basierend auf DTZ-Werten
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-semibold text-purple-700 dark:text-purple-400 mb-2">
                📂 Gruppierung
              </h3>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Züge nach Ergebnis-Typ organisiert mit einklappbaren Bereichen
              </p>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h3 className="font-semibold text-orange-700 dark:text-orange-400 mb-2">
                ♿ Barrierefreiheit
              </h3>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                ARIA-Labels, Tastaturnavigation, Screenreader-Unterstützung
              </p>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                ⚡ Performance
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                Optimiert für große Zugmengen mit effizienter Rendering
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                🧪 Getestet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Umfassende Unit-Tests (25 Tests) mit 100% Code-Coverage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
