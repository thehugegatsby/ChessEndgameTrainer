import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePositionService } from '@shared/contexts/PositionServiceContext';
import { EndgameCategory, EndgameChapter } from '@shared/types';
import { getLogger } from '@shared/services/logging';

const logger = getLogger().setContext('AdvancedEndgameMenu');

interface AdvancedEndgameMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPositionId?: number;
}

interface UserStats {
  rating: number;
  totalPlayed: number;
  successRate: number;
}

interface CategoryWithDetails extends EndgameCategory {
  positionCount: number | null;
  chapters?: EndgameChapter[];
  isLoadingChapters?: boolean;
  isExpanded?: boolean;
}

export const AdvancedEndgameMenu: React.FC<AdvancedEndgameMenuProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const positionService = usePositionService();
  const [categories, setCategories] = useState<CategoryWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ rating: 1123, totalPlayed: 45, successRate: 73 });
  const [totalPositions, setTotalPositions] = useState(0);

  // Load categories and user stats
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user stats from localStorage
        const savedStats = localStorage.getItem('endgame-user-stats');
        if (savedStats) {
          setUserStats(JSON.parse(savedStats));
        }

        // Fetch categories
        const baseCategories = await positionService.getCategories();
        
        // Fetch position counts in parallel
        const categoriesWithCounts = await Promise.all(
          baseCategories.map(async (cat) => {
            try {
              const count = await positionService.getPositionCountByCategory(cat.id);
              return { ...cat, positionCount: count, isExpanded: false } as CategoryWithDetails;
            } catch (err) {
              logger.error(`Failed to get count for category ${cat.id}`, err);
              return { ...cat, positionCount: null, isExpanded: false } as CategoryWithDetails;
            }
          })
        );
        
        setCategories(categoriesWithCounts);
        
        // Calculate total positions
        const total = categoriesWithCounts.reduce((sum, cat) => sum + (cat.positionCount || 0), 0);
        setTotalPositions(total);
        
        setError(null);
      } catch (err) {
        logger.error('Failed to load menu data', err);
        setError('Menü konnte nicht geladen werden');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, positionService]);

  const toggleCategory = async (categoryId: string) => {
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) return;

    const category = categories[categoryIndex];
    
    // Toggle expansion state
    if (category.isExpanded) {
      setCategories(prev => prev.map(c => 
        c.id === categoryId ? { ...c, isExpanded: false } : c
      ));
      return;
    }

    // Expand and load chapters if not already loaded
    if (!category.chapters) {
      setCategories(prev => prev.map(c => 
        c.id === categoryId ? { ...c, isLoadingChapters: true, isExpanded: true } : c
      ));

      try {
        const chapters = await positionService.getChaptersByCategory(categoryId);
        setCategories(prev => prev.map(c => 
          c.id === categoryId ? { ...c, chapters, isLoadingChapters: false } : c
        ));
      } catch (err) {
        logger.error(`Failed to load chapters for category ${categoryId}`, err);
        setCategories(prev => prev.map(c => 
          c.id === categoryId ? { ...c, isLoadingChapters: false, isExpanded: false } : c
        ));
      }
    } else {
      // Just expand if chapters already loaded
      setCategories(prev => prev.map(c => 
        c.id === categoryId ? { ...c, isExpanded: true } : c
      ));
    }
  };

  const getCompletedPositions = () => Math.floor(totalPositions * (userStats.successRate / 100));

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Menu Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-[22rem] bg-gray-900 text-white z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Endgame Training</h2>
            <button 
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-800 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Settings Icon */}
        <div className="p-4 border-b border-gray-700">
          <button className="flex items-center gap-2 w-full p-2 hover:bg-gray-800 rounded text-gray-300">
            <span className="text-lg">⚙️</span>
            <span className="text-sm">Settings</span>
          </button>
        </div>

        {/* Menu Content */}
        <div className="flex-1 overflow-y-auto">
          {/* All (rated) */}
          <div className="p-4">
            <Link href="/dashboard">
              <div className="flex items-center gap-3 p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                <span className="text-lg">🎯</span>
                <span className="font-medium">All (rated)</span>
              </div>
            </Link>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 text-center text-red-400">
              {error}
            </div>
          )}

          {/* Categories */}
          {!isLoading && !error && categories.map((category) => (
            <div key={category.id}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                  {category.positionCount !== null && (
                    <span className="text-xs text-gray-400">({category.positionCount})</span>
                  )}
                </div>
                <span className={`transform transition-transform ${
                  category.isExpanded ? 'rotate-90' : ''
                }`}>
                  ▶
                </span>
              </button>

              {/* Chapters - Lazy Loaded */}
              {category.isExpanded && (
                <div className="bg-gray-800">
                  {/* Loading chapters */}
                  {category.isLoadingChapters && (
                    <div className="px-8 py-3 text-sm text-gray-400">
                      <div className="animate-pulse">Lade Kapitel...</div>
                    </div>
                  )}
                  
                  {/* Chapters */}
                  {!category.isLoadingChapters && category.chapters && (
                    <>
                      {/* All positions in category */}
                      <div className="px-8 py-2">
                        <Link href={`/train/1?category=${category.id}`}>
                          <div className="p-2 hover:bg-gray-700 rounded text-sm text-gray-300">
                            Alle Positionen
                          </div>
                        </Link>
                      </div>
                      
                      {/* Individual chapters */}
                      {category.chapters.map((chapter) => (
                        <div key={chapter.id} className="px-8 py-1">
                          <Link href={`/train/1?chapter=${chapter.id}`}>
                            <div className="p-2 hover:bg-gray-700 rounded text-sm text-gray-300 flex items-center gap-2">
                              <span className="text-xs">🎯</span>
                              <span>{chapter.name}</span>
                              <span className="ml-auto text-xs text-gray-500">
                                {chapter.totalLessons}
                              </span>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* No chapters message */}
                  {!category.isLoadingChapters && category.chapters && category.chapters.length === 0 && (
                    <div className="px-8 py-3 text-sm text-gray-500">
                      Keine Kapitel verfügbar
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Future Categories (placeholder) */}
          {['Queen endgames', 'Knight endgames', 'Bishop endgames'].map((name) => (
            <button
              key={name}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors text-left text-gray-500"
              disabled
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {name.includes('Queen') ? '♛' : name.includes('Knight') ? '♞' : '♝'}
                </span>
                <span className="font-medium">{name}</span>
              </div>
              <span>▶</span>
            </button>
          ))}
        </div>

        {/* User Profile Section */}
        <div className="border-t border-gray-700 p-4">
          <div className="mb-3 text-xs text-gray-400">
            <div>Total Positions: {totalPositions}</div>
            <div>Completed: {getCompletedPositions()}</div>
          </div>
          <Link href="/profile">
            <div className="flex items-center justify-between p-3 hover:bg-gray-800 rounded transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-sm">👤</span>
                </div>
                <div>
                  <div className="text-sm font-medium">D.</div>
                  <div className="text-xs text-gray-400">Rating: {userStats.rating}</div>
                </div>
              </div>
              <span>▶</span>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdvancedEndgameMenu; 