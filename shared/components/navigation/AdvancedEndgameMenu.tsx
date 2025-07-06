import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { endgameCategories, EndgameCategory, EndgameSubcategory, allEndgamePositions, endgameChapters } from '@shared/data/endgames/index';

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

export const AdvancedEndgameMenu: React.FC<AdvancedEndgameMenuProps> = ({ 
  isOpen, 
  onClose, 
  currentPositionId 
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [userStats, setUserStats] = useState<UserStats>({ rating: 1123, totalPlayed: 45, successRate: 73 });

  // Load user stats from localStorage
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem('endgame-user-stats');
      if (savedStats) {
        setUserStats(JSON.parse(savedStats));
      }
    } catch (error) {
      // Silently ignore localStorage errors and use default stats
      console.error('Failed to load user stats from localStorage:', error);
    }
  }, []);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getTotalPositions = () => allEndgamePositions.length;
  const getCompletedPositions = () => Math.floor(allEndgamePositions.length * (userStats.successRate / 100));

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
        fixed left-0 top-0 h-full w-80 bg-gray-900 text-white z-50 transform transition-transform duration-300 ease-in-out
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

          {/* Categories */}
          {endgameCategories.map((category) => (
            <div key={category.id}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </div>
                <span className={`transform transition-transform ${
                  expandedCategories.has(category.id) ? 'rotate-90' : ''
                }`}>
                  ▶
                </span>
              </button>

              {/* Subcategories */}
              {expandedCategories.has(category.id) && (
                <div className="bg-gray-800">
                  {/* All subcategory */}
                  <div className="px-8 py-2">
                    <Link href={`/train/${category.positions[0]?.id || 1}`}>
                      <div className="p-2 hover:bg-gray-700 rounded text-sm text-gray-300">
                        All
                      </div>
                    </Link>
                  </div>

                  {/* Thematic chapters for this category */}
                  {endgameChapters
                    .filter(chapter => chapter.category === category.id)
                    .map((chapter) => (
                      <div key={chapter.id} className="px-8 py-1">
                        <Link href={`/train/${chapter.lessons[0]?.id || 1}`}>
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

                  {/* Material-based subcategories */}
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory.id} className="px-8 py-1">
                      <Link href={`/train/${subcategory.positions[0]?.id || 1}`}>
                        <div className="p-2 hover:bg-gray-700 rounded text-sm text-gray-300 flex items-center gap-2">
                          <span className="text-xs">{subcategory.icon}</span>
                          <span>{subcategory.material}</span>
                          <span className="ml-auto text-xs text-gray-500">
                            {subcategory.positions.length}
                          </span>
                        </div>
                      </Link>
                    </div>
                  ))}

                  {/* Other subcategory */}
                  <div className="px-8 py-2">
                    <div className="p-2 text-sm text-gray-500">
                      Other
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Future Categories (placeholder) */}
          {['Queen endgames', 'Knight endgames', 'Bishop endgames'].map((name, index) => (
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