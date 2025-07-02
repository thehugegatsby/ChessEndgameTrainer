/**
 * @fileoverview Endgame Categories and Classification System
 * @version 1.0.0
 * @description Extracted category definitions for better maintainability
 * Optimized for mobile navigation and Android app development
 */

import { Chess } from 'chess.js';
import type { EndgamePosition, EndgameCategory, EndgameSubcategory } from './types';

/**
 * Creates subcategories based on material classification
 * Mobile-optimized for efficient filtering and navigation
 */
export function createSubcategories(category: string, positions: EndgamePosition[]): EndgameSubcategory[] {
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

/**
 * Gets appropriate chess icon for material combination
 * Mobile-friendly unicode chess symbols
 */
export function getIconForMaterial(material: string): string {
  if (material.includes('K+P vs K')) return '♙♟ vs ♙';
  if (material.includes('K+2P vs K+P')) return '♙♟♟ vs ♙♟';
  if (material.includes('K+R+P vs K+R')) return '♜♙ vs ♜';
  if (material.includes('K+Q')) return '♛';
  if (material.includes('K+R')) return '♜';
  if (material.includes('K+B')) return '♗';
  if (material.includes('K+N')) return '♘';
  return '♙♟';
}

/**
 * Validates FEN position for mobile compatibility
 * Ensures positions work on mobile chess engines
 */
export function validateFen(fen: string): boolean {
  try {
    const chess = new Chess();
    chess.load(fen);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates the main category structure
 * Optimized for Android app navigation
 */
export function createEndgameCategories(allPositions: EndgamePosition[]): EndgameCategory[] {
  return [
    {
      id: "pawn",
      name: "Bauernendspiele", 
      description: "Fundamentale Endspiele mit Bauern und Königen - Essential für jeder Spielstärke",
      icon: "♙",
      subcategories: createSubcategories("pawn", allPositions.filter(p => p.category === "pawn")),
      positions: allPositions.filter(p => p.category === "pawn"),
      // Mobile-specific metadata
      mobilePriority: 1,
      estimatedStudyTime: "2-4 Wochen",
      skillLevel: "Beginner bis Fortgeschritten"
    },
    {
      id: "rook",
      name: "Turmendspiele",
      description: "Wichtige Endspiele mit Türmen - Häufigste Endspiele in der Praxis", 
      icon: "♜",
      subcategories: createSubcategories("rook", allPositions.filter(p => p.category === "rook")),
      positions: allPositions.filter(p => p.category === "rook"),
      // Mobile-specific metadata
      mobilePriority: 2,
      estimatedStudyTime: "3-6 Wochen",
      skillLevel: "Fortgeschritten"
    },
    {
      id: "queen",
      name: "Damenendspiele",
      description: "Komplexe Endspiele mit der Dame - Für fortgeschrittene Spieler",
      icon: "♛",
      subcategories: createSubcategories("queen", allPositions.filter(p => p.category === "queen")),
      positions: allPositions.filter(p => p.category === "queen"),
      mobilePriority: 4,
      estimatedStudyTime: "4-8 Wochen",
      skillLevel: "Experte"
    },
    {
      id: "minor",
      name: "Leichtfigurendspiele",
      description: "Endspiele mit Läufern und Springern - Wichtige taktische Muster",
      icon: "♗",
      subcategories: createSubcategories("minor", allPositions.filter(p => p.category === "minor")),
      positions: allPositions.filter(p => p.category === "minor"),
      mobilePriority: 3,
      estimatedStudyTime: "2-5 Wochen",
      skillLevel: "Fortgeschritten"
    }
  ];
}

// Utility functions for mobile app development
export const categoryUtils = {
  /**
   * Gets category by ID - mobile optimized lookup
   */
  getCategoryById: (categories: EndgameCategory[], id: string): EndgameCategory | undefined => {
    return categories.find(cat => cat.id === id);
  },

  /**
   * Gets positions for a specific difficulty - mobile filtering
   */
  getPositionsByDifficulty: (positions: EndgamePosition[], difficulty: string): EndgamePosition[] => {
    return positions.filter(pos => pos.difficulty === difficulty);
  },

  /**
   * Gets due positions for spaced repetition (mobile training)
   */
  getDuePositions: (positions: EndgamePosition[]): EndgamePosition[] => {
    // This would integrate with a spaced repetition system
    // For now, return positions that haven't been played recently
    return positions.filter(pos => !pos.userRating || pos.timesPlayed === 0);
  },

  /**
   * Calculates progress statistics for mobile dashboard
   */
  calculateProgress: (positions: EndgamePosition[]): {
    total: number;
    completed: number;
    averageRating: number;
    totalStudyTime: number;
  } => {
    const total = positions.length;
    const completed = positions.filter(pos => pos.successRate && pos.successRate > 0.8).length;
    const averageRating = positions.reduce((sum, pos) => sum + (pos.userRating || 0), 0) / total;
    const totalStudyTime = positions.reduce((sum, pos) => sum + (pos.timesPlayed || 0), 0);

    return { total, completed, averageRating, totalStudyTime };
  }
}; 