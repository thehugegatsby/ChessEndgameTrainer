import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressCard } from './ProgressCard';

describe('ProgressCard - Comprehensive Coverage', () => {
  const mockStats = {
    total: 10,
    completed: 7,
    successRate: 0.85,
    dueToday: 3,
    streak: 5
  };

  const defaultProps = {
    title: 'Test Endgame',
    description: 'Test description for endgame',
    stats: mockStats,
    difficulty: 'intermediate' as const,
    category: 'pawn' as const,
    onStartTraining: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('sollte alle grundlegenden Inhalte rendern', () => {
      render(<ProgressCard {...defaultProps} />);
      
      expect(screen.getByText('Test Endgame')).toBeInTheDocument();
      expect(screen.getByText('Test description for endgame')).toBeInTheDocument();
      expect(screen.getByText('♟️')).toBeInTheDocument(); // pawn icon
      expect(screen.getByText('⚡')).toBeInTheDocument(); // intermediate icon
    });

    it('sollte den Fortschritt korrekt berechnen und anzeigen', () => {
      render(<ProgressCard {...defaultProps} />);
      
      expect(screen.getByText('7/10')).toBeInTheDocument();
      expect(screen.getByText('70% abgeschlossen')).toBeInTheDocument();
    });

    it('sollte die Erfolgsrate korrekt anzeigen', () => {
      render(<ProgressCard {...defaultProps} />);
      
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Erfolgsrate')).toBeInTheDocument();
    });

    it('sollte fällige Aufgaben anzeigen', () => {
      render(<ProgressCard {...defaultProps} />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Heute fällig')).toBeInTheDocument();
    });
  });

  describe('Difficulty Variants', () => {
    it('sollte beginner difficulty korrekt anzeigen', () => {
      render(<ProgressCard {...defaultProps} difficulty="beginner" />);
      
      expect(screen.getByText('🌱')).toBeInTheDocument();
      expect(screen.getByText('beginner')).toBeInTheDocument();
    });

    it('sollte intermediate difficulty korrekt anzeigen', () => {
      render(<ProgressCard {...defaultProps} difficulty="intermediate" />);
      
      expect(screen.getByText('⚡')).toBeInTheDocument();
      expect(screen.getByText('intermediate')).toBeInTheDocument();
    });

    it('sollte advanced difficulty korrekt anzeigen', () => {
      render(<ProgressCard {...defaultProps} difficulty="advanced" />);
      
      expect(screen.getAllByText('🔥')).toHaveLength(2); // One in difficulty badge, one in streak
      expect(screen.getByText('advanced')).toBeInTheDocument();
    });
  });

  describe('Category Icons', () => {
    it('sollte pawn category icon anzeigen', () => {
      render(<ProgressCard {...defaultProps} category="pawn" />);
      expect(screen.getByText('♟️')).toBeInTheDocument();
    });

    it('sollte rook category icon anzeigen', () => {
      render(<ProgressCard {...defaultProps} category="rook" />);
      expect(screen.getByText('♜')).toBeInTheDocument();
    });

    it('sollte queen category icon anzeigen', () => {
      render(<ProgressCard {...defaultProps} category="queen" />);
      expect(screen.getByText('♛')).toBeInTheDocument();
    });

    it('sollte minor category icon anzeigen', () => {
      render(<ProgressCard {...defaultProps} category="minor" />);
      expect(screen.getByText('♝')).toBeInTheDocument();
    });

    it('sollte other category icon anzeigen', () => {
      render(<ProgressCard {...defaultProps} category="other" />);
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('sollte 100% Fortschritt korrekt anzeigen', () => {
      const fullStats = { ...mockStats, completed: 10 };
      render(<ProgressCard {...defaultProps} stats={fullStats} />);
      
      expect(screen.getByText('10/10')).toBeInTheDocument();
      expect(screen.getByText('100% abgeschlossen')).toBeInTheDocument();
    });

    it('sollte 0% Fortschritt korrekt anzeigen', () => {
      const emptyStats = { ...mockStats, completed: 0 };
      render(<ProgressCard {...defaultProps} stats={emptyStats} />);
      
      expect(screen.getByText('0/10')).toBeInTheDocument();
      expect(screen.getByText('0% abgeschlossen')).toBeInTheDocument();
    });

    it('sollte mit total=0 umgehen können', () => {
      const zeroTotalStats = { ...mockStats, total: 0, completed: 0 };
      render(<ProgressCard {...defaultProps} stats={zeroTotalStats} />);
      
      expect(screen.getByText('0/0')).toBeInTheDocument();
      expect(screen.getByText('0% abgeschlossen')).toBeInTheDocument();
    });

    it('sollte Rundung korrekt handhaben', () => {
      const oddStats = { ...mockStats, total: 3, completed: 1 }; // 33.33%
      render(<ProgressCard {...defaultProps} stats={oddStats} />);
      
      expect(screen.getByText('33% abgeschlossen')).toBeInTheDocument();
    });
  });

  describe('Success Rate Display', () => {
    it('sollte verschiedene Erfolgsraten korrekt anzeigen', () => {
      const highSuccessStats = { ...mockStats, successRate: 0.95 };
      render(<ProgressCard {...defaultProps} stats={highSuccessStats} />);
      
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('sollte niedrige Erfolgsrate korrekt anzeigen', () => {
      const lowSuccessStats = { ...mockStats, successRate: 0.1 };
      render(<ProgressCard {...defaultProps} stats={lowSuccessStats} />);
      
      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('sollte 0% Erfolgsrate anzeigen', () => {
      const zeroSuccessStats = { ...mockStats, successRate: 0 };
      render(<ProgressCard {...defaultProps} stats={zeroSuccessStats} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Streak Display', () => {
    it('sollte Streak anzeigen wenn > 0', () => {
      render(<ProgressCard {...defaultProps} />);
      
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('5 Tage Streak')).toBeInTheDocument();
    });

    it('sollte keine Streak anzeigen wenn = 0', () => {
      const noStreakStats = { ...mockStats, streak: 0 };
      render(<ProgressCard {...defaultProps} stats={noStreakStats} />);
      
      expect(screen.queryByText('Tage Streak')).not.toBeInTheDocument();
    });

    it('sollte lange Streaks korrekt anzeigen', () => {
      const longStreakStats = { ...mockStats, streak: 99 };
      render(<ProgressCard {...defaultProps} stats={longStreakStats} />);
      
      expect(screen.getByText('99 Tage Streak')).toBeInTheDocument();
    });
  });

  describe('Training Button', () => {
    it('sollte Training Button mit fälligen Aufgaben rendern', () => {
      render(<ProgressCard {...defaultProps} />);
      
      expect(screen.getByText('3 Aufgaben trainieren')).toBeInTheDocument();
    });

    it('sollte allgemeinen Button Text zeigen wenn keine Aufgaben fällig', () => {
      const noTasksStats = { ...mockStats, dueToday: 0 };
      render(<ProgressCard {...defaultProps} stats={noTasksStats} />);
      
      expect(screen.getByText('Training starten')).toBeInTheDocument();
    });

    it('sollte onStartTraining callback aufrufen', () => {
      render(<ProgressCard {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(defaultProps.onStartTraining).toHaveBeenCalledTimes(1);
    });

    it('sollte als Button-Element rendern', () => {
      render(<ProgressCard {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Styling and CSS Classes', () => {
    it('sollte korrekte Difficulty-Farben für beginner haben', () => {
      const { container } = render(<ProgressCard {...defaultProps} difficulty="beginner" />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('from-green-50', 'to-emerald-50', 'border-green-200');
    });

    it('sollte korrekte Difficulty-Farben für intermediate haben', () => {
      const { container } = render(<ProgressCard {...defaultProps} difficulty="intermediate" />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('from-yellow-50', 'to-orange-50', 'border-yellow-200');
    });

    it('sollte korrekte Difficulty-Farben für advanced haben', () => {
      const { container } = render(<ProgressCard {...defaultProps} difficulty="advanced" />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('from-red-50', 'to-pink-50', 'border-red-200');
    });

    it('sollte hover-Effekte haben', () => {
      const { container } = render(<ProgressCard {...defaultProps} />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:shadow-xl', 'hover:scale-105');
    });

    it('sollte Gradient-Hintergrund haben', () => {
      const { container } = render(<ProgressCard {...defaultProps} />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-gradient-to-br');
    });
  });

  describe('Progress Bar', () => {
    it('sollte Progress Bar mit korrekter Breite rendern', () => {
      const { container } = render(<ProgressCard {...defaultProps} />);
      
      const progressBar = container.querySelector('[style*="width: 70%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('sollte 100% Breite für vollständigen Fortschritt haben', () => {
      const fullStats = { ...mockStats, completed: 10 };
      const { container } = render(<ProgressCard {...defaultProps} stats={fullStats} />);
      
      const progressBar = container.querySelector('[style*="width: 100%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('sollte 0% Breite für keinen Fortschritt haben', () => {
      const emptyStats = { ...mockStats, completed: 0 };
      const { container } = render(<ProgressCard {...defaultProps} stats={emptyStats} />);
      
      const progressBar = container.querySelector('[style*="width: 0%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('sollte Button für Screenreader zugänglich sein', () => {
      render(<ProgressCard {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('sollte alle wichtigen Texte für Screenreader haben', () => {
      render(<ProgressCard {...defaultProps} />);
      
      expect(screen.getByText('Test Endgame')).toBeInTheDocument();
      expect(screen.getByText('Fortschritt')).toBeInTheDocument();
      expect(screen.getByText('Erfolgsrate')).toBeInTheDocument();
      expect(screen.getByText('Heute fällig')).toBeInTheDocument();
    });
  });
}); 