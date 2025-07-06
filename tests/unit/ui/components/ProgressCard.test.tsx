import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import component using relative path
import { ProgressCard } from '../../../../shared/components/ui/ProgressCard';

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

    it('sollte heute fällige Karten anzeigen', () => {
      render(<ProgressCard {...defaultProps} />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('heute fällig')).toBeInTheDocument();
    });

    it('sollte die aktuelle Serie anzeigen', () => {
      render(<ProgressCard {...defaultProps} />);
      
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Tag Serie')).toBeInTheDocument();
    });
  });

  describe('Button Interaction', () => {
    it('sollte onStartTraining aufrufen wenn der Button geklickt wird', () => {
      render(<ProgressCard {...defaultProps} />);
      
      const button = screen.getByText('Training starten');
      fireEvent.click(button);
      
      expect(defaultProps.onStartTraining).toHaveBeenCalledTimes(1);
    });

    it('sollte den korrekten Button-Text anzeigen', () => {
      render(<ProgressCard {...defaultProps} />);
      
      expect(screen.getByText('Training starten')).toBeInTheDocument();
    });
  });

  describe('Category Icons', () => {
    it('sollte das korrekte Icon für Bauern-Endspiele anzeigen', () => {
      render(<ProgressCard {...defaultProps} category="pawn" />);
      expect(screen.getByText('♟️')).toBeInTheDocument();
    });

    it('sollte das korrekte Icon für Königin-Endspiele anzeigen', () => {
      render(<ProgressCard {...defaultProps} category="queen" />);
      expect(screen.getByText('♕')).toBeInTheDocument();
    });

    it('sollte das korrekte Icon für Turm-Endspiele anzeigen', () => {
      render(<ProgressCard {...defaultProps} category="rook" />);
      expect(screen.getByText('♖')).toBeInTheDocument();
    });

    it('sollte das korrekte Icon für Läufer-Endspiele anzeigen', () => {
      render(<ProgressCard {...defaultProps} category="bishop" />);
      expect(screen.getByText('♗')).toBeInTheDocument();
    });

    it('sollte das korrekte Icon für Springer-Endspiele anzeigen', () => {
      render(<ProgressCard {...defaultProps} category="knight" />);
      expect(screen.getByText('♘')).toBeInTheDocument();
    });

    it('sollte das Standard-Icon für unbekannte Kategorien anzeigen', () => {
      render(<ProgressCard {...defaultProps} category="unknown" as any />);
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });
  });

  describe('Difficulty Display', () => {
    it('sollte das korrekte Icon für Beginner-Schwierigkeit anzeigen', () => {
      render(<ProgressCard {...defaultProps} difficulty="beginner" />);
      expect(screen.getByText('🌱')).toBeInTheDocument();
    });

    it('sollte das korrekte Icon für Intermediate-Schwierigkeit anzeigen', () => {
      render(<ProgressCard {...defaultProps} difficulty="intermediate" />);
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });

    it('sollte das korrekte Icon für Advanced-Schwierigkeit anzeigen', () => {
      render(<ProgressCard {...defaultProps} difficulty="advanced" />);
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('sollte das Standard-Icon für unbekannte Schwierigkeit anzeigen', () => {
      render(<ProgressCard {...defaultProps} difficulty="unknown" as any />);
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('sollte mit 0% Fortschritt umgehen', () => {
      const zeroProgressStats = { ...mockStats, completed: 0 };
      render(<ProgressCard {...defaultProps} stats={zeroProgressStats} />);
      
      expect(screen.getByText('0/10')).toBeInTheDocument();
      expect(screen.getByText('0% abgeschlossen')).toBeInTheDocument();
    });

    it('sollte mit 100% Fortschritt umgehen', () => {
      const fullProgressStats = { ...mockStats, completed: 10 };
      render(<ProgressCard {...defaultProps} stats={fullProgressStats} />);
      
      expect(screen.getByText('10/10')).toBeInTheDocument();
      expect(screen.getByText('100% abgeschlossen')).toBeInTheDocument();
    });

    it('sollte mit 0% Erfolgsrate umgehen', () => {
      const zeroSuccessStats = { ...mockStats, successRate: 0 };
      render(<ProgressCard {...defaultProps} stats={zeroSuccessStats} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('sollte mit 100% Erfolgsrate umgehen', () => {
      const perfectSuccessStats = { ...mockStats, successRate: 1 };
      render(<ProgressCard {...defaultProps} stats={perfectSuccessStats} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('sollte mit leeren heute fälligen Karten umgehen', () => {
      const noDueStats = { ...mockStats, dueToday: 0 };
      render(<ProgressCard {...defaultProps} stats={noDueStats} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('heute fällig')).toBeInTheDocument();
    });

    it('sollte mit 0-Tag Serie umgehen', () => {
      const noStreakStats = { ...mockStats, streak: 0 };
      render(<ProgressCard {...defaultProps} stats={noStreakStats} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('Tag Serie')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('sollte die korrekte Container-Struktur haben', () => {
      const { container } = render(<ProgressCard {...defaultProps} />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white', 'rounded-xl', 'shadow-md', 'p-6', 'border', 'border-gray-200');
    });

    it('sollte einen Hover-Effekt haben', () => {
      const { container } = render(<ProgressCard {...defaultProps} />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow', 'duration-200');
    });

    it('sollte die korrekte Fortschrittsbalken-Breite setzen', () => {
      const { container } = render(<ProgressCard {...defaultProps} />);
      
      const progressBar = container.querySelector('[style*="width: 70%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });
});