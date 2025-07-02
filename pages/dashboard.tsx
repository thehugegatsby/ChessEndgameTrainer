import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { ProgressCard } from '../shared/components/ui/ProgressCard';
import { chapters } from '../shared/data/endgames';
import { AppLayout } from '@shared/components/layout/AppLayout';

interface ProgressData {
  [chapterId: string]: {
    total: number;
    completed: number;
    successRate: number;
    dueToday: number;
    streak: number;
  };
}

const Dashboard: NextPage = () => {
  const [progressData, setProgressData] = useState<ProgressData>({});
  const [totalStats, setTotalStats] = useState({
    totalPositions: 0,
    completedPositions: 0,
    overallSuccessRate: 0,
    totalDueToday: 0,
    currentStreak: 0
  });

  useEffect(() => {
    // Load progress data from localStorage
    const loadProgressData = () => {
      const mockProgressData: ProgressData = {};
      let totalPositions = 0;
      let completedPositions = 0;
      let totalDueToday = 0;
      let successSum = 0;
      let chapterCount = 0;

      chapters.forEach(chapter => {
        const chapterProgress = {
          total: chapter.positions.length,
          completed: Math.floor(Math.random() * chapter.positions.length), // Mock data
          successRate: 0.7 + Math.random() * 0.3, // Mock success rate 70-100%
          dueToday: Math.floor(Math.random() * 3), // Mock due today 0-2
          streak: Math.floor(Math.random() * 10) // Mock streak 0-9
        };

        mockProgressData[chapter.id] = chapterProgress;
        totalPositions += chapterProgress.total;
        completedPositions += chapterProgress.completed;
        totalDueToday += chapterProgress.dueToday;
        successSum += chapterProgress.successRate;
        chapterCount++;
      });

      setProgressData(mockProgressData);
      setTotalStats({
        totalPositions,
        completedPositions,
        overallSuccessRate: chapterCount > 0 ? successSum / chapterCount : 0,
        totalDueToday,
        currentStreak: Math.floor(Math.random() * 15) // Mock overall streak
      });
    };

    loadProgressData();
  }, []);

  const handleStartTraining = (chapterId: string) => {
    // Navigate to training with specific chapter
    window.location.href = `/train?chapter=${chapterId}`;
  };

  const overallProgress = totalStats.totalPositions > 0 
    ? Math.round((totalStats.completedPositions / totalStats.totalPositions) * 100) 
    : 0;

  return (
    <AppLayout>
      <main className="px-4 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Verfolge deinen Fortschritt im Endspiel-Training
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="dark-card-elevated rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Gesamte Partien
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {totalStats.totalPositions}
                </p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </div>

          <div className="dark-card-elevated rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Gewinnrate
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--success-text)' }}>
                  {Math.round(totalStats.overallSuccessRate * 100)}%
                </p>
              </div>
              <div className="text-3xl">🏆</div>
            </div>
          </div>

          <div className="dark-card-elevated rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Ø Genauigkeit
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--info-text)' }}>
                  {overallProgress}%
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>

          <div className="dark-card-elevated rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Aktuelle Serie
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--warning-text)' }}>
                  {totalStats.currentStreak}
                </p>
              </div>
              <div className="text-3xl">🔥</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {totalStats.totalDueToday > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 mb-8 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-1">
                  🚨 Aufgaben warten auf dich!
                </h3>
                <p className="text-orange-700 dark:text-orange-300">
                  Du hast {totalStats.totalDueToday} Stellungen, die heute wiederholt werden sollten.
                </p>
              </div>
              <Link
                href="/train?mode=review"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Jetzt trainieren
              </Link>
            </div>
          </div>
        )}

        {/* Chapter Progress */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Trainingskapitel
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map(chapter => {
              const stats = progressData[chapter.id] || {
                total: chapter.positions.length,
                completed: 0,
                successRate: 0,
                dueToday: 0,
                streak: 0
              };

              // Determine difficulty based on chapter content
              const difficulty = chapter.id.includes('basic') ? 'beginner' : 
                               chapter.id.includes('advanced') ? 'advanced' : 'intermediate';

              // Determine category based on chapter content
              const category = chapter.id.includes('pawn') ? 'pawn' :
                             chapter.id.includes('rook') ? 'rook' :
                             chapter.id.includes('queen') ? 'queen' :
                             chapter.id.includes('minor') ? 'minor' : 'other';

              return (
                <ProgressCard
                  key={chapter.id}
                  title={chapter.name}
                  description={chapter.description}
                  stats={stats}
                  difficulty={difficulty}
                  category={category}
                  onStartTraining={() => handleStartTraining(chapter.id)}
                />
              );
            })}
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default Dashboard; 