import { Chess } from 'chess.js';
import { EndgamePosition, EndgameCategory, EndgameSubcategory, EndgameChapter } from './types';
import { pawnEndgames } from './positions/pawn';
import { rookEndgames } from './positions/rook';

// Combine all positions from modules
export const allEndgamePositions: EndgamePosition[] = [
  ...pawnEndgames,
  ...rookEndgames
];


// Create subcategories based on material
function createSubcategories(category: string): EndgameSubcategory[] {
  const positions = allEndgamePositions.filter(p => p.category === category);
  const materialGroups = new Map<string, EndgamePosition[]>();
  
  positions.forEach(pos => {
    const materialKey = `${pos.material.white} vs ${pos.material.black}`;
    if (!materialGroups.has(materialKey)) {
      materialGroups.set(materialKey, []);
    }
    materialGroups.get(materialKey)!.push(pos);
  });
  
  return Array.from(materialGroups.entries()).map(([material, positions]) => ({
    id: `${category}-${material.replace(/\+/g, '').replace(/\s/g, '-').toLowerCase()}`,
    name: material,
    material,
    icon: getIconForMaterial(material),
    positions
  }));
}

function getIconForMaterial(material: string): string {
  if (material.includes('K+P vs K')) return '♙♟ vs ♙';
  if (material.includes('K+2P vs K+P')) return '♙♟♟ vs ♙♟';
  if (material.includes('K+R+P vs K+R')) return '♜♙ vs ♜';
  return '♙♟';
}

// Categories with new structure
export const endgameCategories: EndgameCategory[] = [
  {
    id: "pawn",
    name: "Bauernendspiele", 
    description: "Fundamentale Endspiele mit Bauern und Königen",
    icon: "♙",
    subcategories: createSubcategories("pawn"),
    positions: allEndgamePositions.filter(p => p.category === "pawn")
  },
  {
    id: "rook",
    name: "Turmendspiele",
    description: "Wichtige Endspiele mit Türmen", 
    icon: "♜",
    subcategories: createSubcategories("rook"),
    positions: allEndgamePositions.filter(p => p.category === "rook")
  }
];

// Utility functions
export function getPositionById(id: number): EndgamePosition | undefined {
  return allEndgamePositions.find(p => p.id === id);
}

export function getPositionsByCategory(category: string): EndgamePosition[] {
  return allEndgamePositions.filter(p => p.category === category);
}

export function validateFen(fen: string): boolean {
  try {
    const chess = new Chess();
    chess.load(fen);
    return true;
  } catch {
    return false;
  }
}

// Chapter system
export let endgameChapters: EndgameChapter[];

// Utility functions for chapters
export function getChapterById(id: string): EndgameChapter | undefined {
  return endgameChapters.find(c => c.id === id);
}

export function getChapterByPositionId(positionId: number): { chapter: EndgameChapter; lessonIndex: number } | undefined {
  for (const chapter of endgameChapters) {
    const lessonIndex = chapter.lessons.findIndex(lesson => lesson.id === positionId);
    if (lessonIndex !== -1) {
      return { chapter, lessonIndex };
    }
  }
  return undefined;
}

export function getChapterProgress(positionId: number): string {
  const result = getChapterByPositionId(positionId);
  if (result) {
    const { chapter, lessonIndex } = result;
    return `${chapter.name} ${lessonIndex + 1}/${chapter.totalLessons}`;
  }
  // Fallback for positions not in chapters
  const position = getPositionById(positionId);
  if (position) {
    const categoryPositions = allEndgamePositions.filter(p => p.category === position.category);
    const index = categoryPositions.findIndex(p => p.id === positionId);
    return `${position.category} ${index + 1}/${categoryPositions.length}`;
  }
  return "Unbekannt";
}

// Initialize chapters after all positions are defined
endgameChapters = [
  {
    id: "brueckenbau",
    name: "Brückenbau", 
    description: "Fundamentale Brückenbau-Techniken im Turmendspiel",
    category: "rook",
    lessons: [
      allEndgamePositions.find(p => p.id === 12)!, // Zickzack laufen (einfachste)
      allEndgamePositions.find(p => p.id === 13)!, // Turm positionieren  
      allEndgamePositions.find(p => p.id === 14)!, // König abdrängen
      allEndgamePositions.find(p => p.id === 15)!, // Vorbereitung komplett
      allEndgamePositions.find(p => p.id === 16)!   // Meisterprüfung (schwierigste)
    ],
    totalLessons: 5
  },
  {
    id: "opposition", 
    name: "Opposition",
    description: "Grundlagen und fortgeschrittene Opposition-Techniken",
    category: "pawn",
    lessons: [
      allEndgamePositions.find(p => p.id === 1)!, // Opposition Grundlagen
      allEndgamePositions.find(p => p.id === 2)!, // Opposition Fortgeschritten  
      allEndgamePositions.find(p => p.id === 3)!  // Entfernte Opposition
    ],
    totalLessons: 3
  }
];

// Export for backward compatibility
export const chapters = endgameCategories;

// Re-export types for convenience
export type { EndgamePosition, EndgameCategory, EndgameSubcategory, EndgameChapter } from './types';