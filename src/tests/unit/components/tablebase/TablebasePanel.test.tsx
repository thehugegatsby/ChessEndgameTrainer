import { vi } from 'vitest';
/**
 * Unit tests for TablebasePanel component
 * Comprehensive test suite with >75% coverage target
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
// Vitest matchers are available through the setup file
import { 
  TablebasePanel, 
  CompactTablebasePanel, 
  TablebasePanelWithErrorBoundary 
} from '@shared/components/tablebase/TablebasePanel';
import { type TablebaseData } from '@shared/types/evaluation';

describe("TablebasePanel", () => {
  const mockTablebaseData: TablebaseData = {
    isTablebasePosition: true,
    wdlBefore: 2,
    wdlAfter: 2,
    category: "win",
    dtz: 5,
    topMoves: [
      { move: "e4", san: "e4", dtz: 3, dtm: 6, wdl: 2, category: "win" },
      { move: "f4", san: "f4", dtz: 5, dtm: 10, wdl: 2, category: "win" },
      { move: "e5", san: "e5", dtz: 0, dtm: 0, wdl: 0, category: "draw" },
      { move: "f6", san: "f6", dtz: -3, dtm: -6, wdl: -2, category: "loss" },
    ],
  };

  const mockOnMoveSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render tablebase panel with moves", () => {
    render(
      <TablebasePanel
        tablebaseData={mockTablebaseData}
        onMoveSelect={mockOnMoveSelect}
      />,
    );

    expect(screen.getByTestId("tablebase-panel")).toBeInTheDocument();
    expect(screen.getByText("Tablebase")).toBeInTheDocument();
    expect(screen.getByText("4 moves")).toBeInTheDocument();
  });

  it("should render move groups correctly", () => {
    render(
      <TablebasePanel
        tablebaseData={mockTablebaseData}
        onMoveSelect={mockOnMoveSelect}
      />,
    );

    // Check for winning moves group
    expect(screen.getByText("Winning Moves")).toBeInTheDocument();
    expect(screen.getByText("e4")).toBeInTheDocument();
    expect(screen.getByText("f4")).toBeInTheDocument();

    // Check for drawing moves group
    expect(screen.getByText("Drawing Moves")).toBeInTheDocument();
    expect(screen.getByText("e5")).toBeInTheDocument();

    // Check for losing moves group (collapsed by default)
    expect(screen.getByText("Losing Moves")).toBeInTheDocument();

    // Click to expand losing moves group
    const losingMovesHeader = screen
      .getByText("Losing Moves")
      .closest('[role="button"]');
    fireEvent.click(losingMovesHeader!);

    // Now f6 should be visible
    expect(screen.getByText("f6")).toBeInTheDocument();
  });

  it("should handle move selection", () => {
    render(
      <TablebasePanel
        tablebaseData={mockTablebaseData}
        onMoveSelect={mockOnMoveSelect}
      />,
    );

    const moveButton = screen.getByText("e4").closest('[role="button"]');
    fireEvent.click(moveButton!);

    expect(mockOnMoveSelect).toHaveBeenCalledWith("e4");
  });

  it("should show loading state", () => {
    render(
      <TablebasePanel
        tablebaseData={mockTablebaseData}
        onMoveSelect={mockOnMoveSelect}
        loading={true}
      />,
    );

    expect(screen.getByText("Tablebase")).toBeInTheDocument();
    // Should show loading text
    expect(screen.getByText("Lade Analyse...")).toBeInTheDocument();
  });

  it("should handle no tablebase data", () => {
    const noTablebaseData: TablebaseData = {
      isTablebasePosition: false,
    };

    render(
      <TablebasePanel
        tablebaseData={noTablebaseData}
        onMoveSelect={mockOnMoveSelect}
      />,
    );

    expect(screen.getByText("Tablebase")).toBeInTheDocument();
    expect(
      screen.getByText("Keine Tablebase-Daten verfügbar"),
    ).toBeInTheDocument();
  });

  it("should handle empty moves", () => {
    const emptyMovesData: TablebaseData = {
      isTablebasePosition: true,
      topMoves: [],
    };

    render(
      <TablebasePanel
        tablebaseData={emptyMovesData}
        onMoveSelect={mockOnMoveSelect}
      />,
    );

    expect(screen.getByText("Tablebase")).toBeInTheDocument();
    expect(
      screen.getByText("Warte auf Tablebase-Analyse..."),
    ).toBeInTheDocument();
  });

  it("should render statistics correctly", () => {
    render(
      <TablebasePanel
        tablebaseData={mockTablebaseData}
        onMoveSelect={mockOnMoveSelect}
      />,
    );

    // Check statistics section - use more specific selectors to avoid conflicts
    const winningMovesSection = screen.getByText("Winning Moves");
    expect(winningMovesSection).toBeInTheDocument();

    // Check counts are displayed correctly
    const winningCount = screen
      .getByText("Winning Moves")
      .parentElement?.querySelector(".text-xs");
    expect(winningCount).toHaveTextContent("2");

    const drawingMovesSection = screen.getByText("Drawing Moves");
    expect(drawingMovesSection).toBeInTheDocument();
    const drawingCount =
      drawingMovesSection.parentElement?.querySelector(".text-xs");
    expect(drawingCount).toHaveTextContent("1");

    const losingMovesSection = screen.getByText("Losing Moves");
    expect(losingMovesSection).toBeInTheDocument();
    const losingCount =
      losingMovesSection.parentElement?.querySelector(".text-xs");
    expect(losingCount).toHaveTextContent("1");
  });

  it("should handle compact mode", () => {
    render(
      <TablebasePanel
        tablebaseData={mockTablebaseData}
        onMoveSelect={mockOnMoveSelect}
        compact={true}
      />,
    );

    expect(screen.getByTestId("tablebase-panel")).toBeInTheDocument();
    expect(screen.getByText("Tablebase")).toBeInTheDocument();

    // Statistics should not be visible in compact mode
    const statisticsSection = screen.queryByText("Winning");
    expect(statisticsSection).not.toBeInTheDocument();
  });

  it("should highlight selected move", () => {
    render(
      <TablebasePanel
        tablebaseData={mockTablebaseData}
        onMoveSelect={mockOnMoveSelect}
        selectedMove="e4"
      />,
    );

    const selectedMoveElement = screen
      .getByText("e4")
      .closest('[role="button"]');
    expect(selectedMoveElement).toHaveClass(
      "bg-blue-50",
      "dark:bg-blue-900/20",
    );
  });

  describe('Error Handling', () => {
    it('should show error message when error prop is provided', () => {
      render(
        <TablebasePanel
          tablebaseData={mockTablebaseData}
          onMoveSelect={mockOnMoveSelect}
          error="Tablebase service unavailable"
        />
      );

      expect(screen.getByText('Tablebase')).toBeInTheDocument();
      expect(screen.getByText('Analyse konnte nicht geladen werden')).toBeInTheDocument();
      
      // Error state doesn't have data-testid, just the CSS class
      const panel = screen.getByText('Tablebase').closest('.tablebase-panel');
      expect(panel).toBeInTheDocument();
      
      // Should not show move groups when there's an error
      expect(screen.queryByText('Winning Moves')).not.toBeInTheDocument();
    });

    it('should have correct error styling', () => {
      render(
        <TablebasePanel
          tablebaseData={mockTablebaseData}
          onMoveSelect={mockOnMoveSelect}
          error="Test error"
        />
      );

      const errorElement = screen.getByText('Analyse konnte nicht geladen werden');
      expect(errorElement).toHaveClass('text-sm', 'text-red-600', 'dark:text-red-400');
      expect(errorElement).toHaveClass('bg-red-50', 'dark:bg-red-900/20');
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(
        <TablebasePanel
          tablebaseData={mockTablebaseData}
          onMoveSelect={mockOnMoveSelect}
          className="custom-panel-class"
        />
      );

      const panel = screen.getByTestId('tablebase-panel');
      expect(panel).toHaveClass('tablebase-panel', 'custom-panel-class');
    });

    it('should handle undefined selectedMove gracefully', () => {
      render(
        <TablebasePanel
          tablebaseData={mockTablebaseData}
          onMoveSelect={mockOnMoveSelect}
          selectedMove={undefined}
        />
      );

      // Should render without errors
      expect(screen.getByTestId('tablebase-panel')).toBeInTheDocument();
      
      // No moves should have selected styling
      const moveButtons = screen.getAllByRole('button');
      moveButtons.forEach(button => {
        expect(button).not.toHaveClass('bg-blue-50');
      });
    });

    it('should work with all default props', () => {
      render(
        <TablebasePanel
          tablebaseData={mockTablebaseData}
          onMoveSelect={mockOnMoveSelect}
        />
      );

      expect(screen.getByTestId('tablebase-panel')).toBeInTheDocument();
      expect(screen.getByText('Tablebase')).toBeInTheDocument();
    });
  });

  describe('Move Data Edge Cases', () => {
    it('should handle undefined topMoves', () => {
      const undefinedMovesData: TablebaseData = {
        isTablebasePosition: true,
        topMoves: undefined
      };

      render(
        <TablebasePanel
          tablebaseData={undefinedMovesData}
          onMoveSelect={mockOnMoveSelect}
        />
      );

      expect(screen.getByText('Warte auf Tablebase-Analyse...')).toBeInTheDocument();
    });

    it('should handle moves with missing DTM values', () => {
      const incompleteMoveData: TablebaseData = {
        isTablebasePosition: true,
        topMoves: [
          { move: 'e4', san: 'e4', dtz: 3, dtm: 0, wdl: 2, category: 'win' }
        ]
      };

      render(
        <TablebasePanel
          tablebaseData={incompleteMoveData}
          onMoveSelect={mockOnMoveSelect}
        />
      );

      expect(screen.getByText('Tablebase')).toBeInTheDocument();
      expect(screen.getByText('1 moves')).toBeInTheDocument();
      expect(screen.getByText('e4')).toBeInTheDocument();
    });

    it('should handle only winning moves', () => {
      const winOnlyData: TablebaseData = {
        isTablebasePosition: true,
        topMoves: [
          { move: 'e4', san: 'e4', dtz: 3, dtm: 6, wdl: 2, category: 'win' },
          { move: 'f4', san: 'f4', dtz: 5, dtm: 10, wdl: 2, category: 'win' }
        ]
      };

      render(
        <TablebasePanel
          tablebaseData={winOnlyData}
          onMoveSelect={mockOnMoveSelect}
        />
      );

      expect(screen.getByText('Winning Moves')).toBeInTheDocument();
      expect(screen.queryByText('Drawing Moves')).not.toBeInTheDocument();
      expect(screen.queryByText('Losing Moves')).not.toBeInTheDocument();
      expect(screen.getByText('2 moves')).toBeInTheDocument();
    });

    it('should handle only drawing moves', () => {
      const drawOnlyData: TablebaseData = {
        isTablebasePosition: true,
        topMoves: [
          { move: 'e5', san: 'e5', dtz: 0, dtm: 0, wdl: 0, category: 'draw' }
        ]
      };

      render(
        <TablebasePanel
          tablebaseData={drawOnlyData}
          onMoveSelect={mockOnMoveSelect}
        />
      );

      expect(screen.queryByText('Winning Moves')).not.toBeInTheDocument();
      expect(screen.getByText('Drawing Moves')).toBeInTheDocument();
      expect(screen.queryByText('Losing Moves')).not.toBeInTheDocument();
      expect(screen.getByText('1 moves')).toBeInTheDocument();
    });

    it('should handle only losing moves', () => {
      const lossOnlyData: TablebaseData = {
        isTablebasePosition: true,
        topMoves: [
          { move: 'f6', san: 'f6', dtz: -3, dtm: -6, wdl: -2, category: 'loss' }
        ]
      };

      render(
        <TablebasePanel
          tablebaseData={lossOnlyData}
          onMoveSelect={mockOnMoveSelect}
        />
      );

      expect(screen.queryByText('Winning Moves')).not.toBeInTheDocument();
      expect(screen.queryByText('Drawing Moves')).not.toBeInTheDocument();
      expect(screen.getByText('Losing Moves')).toBeInTheDocument();
      expect(screen.getByText('1 moves')).toBeInTheDocument();
    });
  });

  describe('Loading State Variations', () => {
    it('should show loading with custom className', () => {
      render(
        <TablebasePanel
          tablebaseData={mockTablebaseData}
          onMoveSelect={mockOnMoveSelect}
          loading={true}
          className="loading-custom-class"
        />
      );

      const panel = screen.getByText('Lade Analyse...').closest('.tablebase-panel');
      expect(panel).toHaveClass('loading-custom-class');
    });

    it('should prioritize error over loading state', () => {
      render(
        <TablebasePanel
          tablebaseData={mockTablebaseData}
          onMoveSelect={mockOnMoveSelect}
          loading={true}
          error="Connection failed"
        />
      );

      // Error state takes priority - checked first in the component
      expect(screen.getByText('Analyse konnte nicht geladen werden')).toBeInTheDocument();
      expect(screen.queryByText('Lade Analyse...')).not.toBeInTheDocument();
    });
  });

  describe('State Priority Logic', () => {
    it('should prioritize error over no tablebase data', () => {
      const noTablebaseData: TablebaseData = {
        isTablebasePosition: false
      };

      render(
        <TablebasePanel
          tablebaseData={noTablebaseData}
          onMoveSelect={mockOnMoveSelect}
          error="Connection failed"
        />
      );

      expect(screen.getByText('Analyse konnte nicht geladen werden')).toBeInTheDocument();
      expect(screen.queryByText('Keine Tablebase-Daten verfügbar')).not.toBeInTheDocument();
    });

    it('should prioritize loading over no tablebase data', () => {
      const noTablebaseData: TablebaseData = {
        isTablebasePosition: false
      };

      render(
        <TablebasePanel
          tablebaseData={noTablebaseData}
          onMoveSelect={mockOnMoveSelect}
          loading={true}
        />
      );

      expect(screen.getByText('Lade Analyse...')).toBeInTheDocument();
      expect(screen.queryByText('Keine Tablebase-Daten verfügbar')).not.toBeInTheDocument();
    });
  });

  describe('Visual States and Styling', () => {
    it('should show correct state colors and messages', () => {
      // Test all different message states with proper styling
      const { rerender } = render(
        <TablebasePanel
          tablebaseData={mockTablebaseData}
          onMoveSelect={mockOnMoveSelect}
          error="Test error"
        />
      );

      // Error state
      expect(screen.getByText('Analyse konnte nicht geladen werden')).toHaveClass('text-red-600');

      // Loading state
      rerender(
        <TablebasePanel
          tablebaseData={mockTablebaseData}
          onMoveSelect={mockOnMoveSelect}
          loading={true}
        />
      );
      expect(screen.getByText('Lade Analyse...')).toHaveClass('text-gray-500');

      // No tablebase data
      const noTablebaseData: TablebaseData = { isTablebasePosition: false };
      rerender(
        <TablebasePanel
          tablebaseData={noTablebaseData}
          onMoveSelect={mockOnMoveSelect}
        />
      );
      expect(screen.getByText('Keine Tablebase-Daten verfügbar')).toHaveClass('text-amber-600');

      // Waiting for analysis
      const emptyMovesData: TablebaseData = { isTablebasePosition: true, topMoves: [] };
      rerender(
        <TablebasePanel
          tablebaseData={emptyMovesData}
          onMoveSelect={mockOnMoveSelect}
        />
      );
      expect(screen.getByText('Warte auf Tablebase-Analyse...')).toHaveClass('text-green-600');
    });
  });
});

describe('CompactTablebasePanel', () => {
  const mockTablebaseData: TablebaseData = {
    isTablebasePosition: true,
    topMoves: [
      { move: 'e4', san: 'e4', dtz: 3, dtm: 6, wdl: 2, category: 'win' }
    ]
  };

  it('should render in compact mode by default', () => {
    render(
      <CompactTablebasePanel
        tablebaseData={mockTablebaseData}
        onMoveSelect={vi.fn()}
      />
    );

    const panel = screen.getByTestId('tablebase-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass('compact-tablebase-panel');
  });

  it('should combine custom className with compact class', () => {
    render(
      <CompactTablebasePanel
        tablebaseData={mockTablebaseData}
        onMoveSelect={vi.fn()}
        className="custom-compact-class"
      />
    );

    const panel = screen.getByTestId('tablebase-panel');
    expect(panel).toHaveClass('compact-tablebase-panel', 'custom-compact-class');
  });

  it('should pass through all props correctly', () => {
    const mockOnMoveSelect = vi.fn();
    render(
      <CompactTablebasePanel
        tablebaseData={mockTablebaseData}
        onMoveSelect={mockOnMoveSelect}
        selectedMove="e4"
        loading={false}
        error={undefined}
      />
    );

    expect(screen.getByText('Tablebase')).toBeInTheDocument();
    expect(screen.getByText('1 moves')).toBeInTheDocument();

    const moveButton = screen.getByText('e4').closest('[role="button"]');
    fireEvent.click(moveButton!);
    expect(mockOnMoveSelect).toHaveBeenCalledWith('e4');
  });
});

describe('TablebasePanelWithErrorBoundary', () => {
  const mockTablebaseData: TablebaseData = {
    isTablebasePosition: true,
    topMoves: [
      { move: 'e4', san: 'e4', dtz: 3, dtm: 6, wdl: 2, category: 'win' }
    ]
  };

  it('should render normally when no error occurs', () => {
    render(
      <TablebasePanelWithErrorBoundary
        tablebaseData={mockTablebaseData}
        onMoveSelect={vi.fn()}
      />
    );

    expect(screen.getByTestId('tablebase-panel')).toBeInTheDocument();
    expect(screen.getByText('Tablebase')).toBeInTheDocument();
  });

  it('should be the same component as TablebasePanel', () => {
    // This tests that the error boundary wrapper is just an alias
    expect(TablebasePanelWithErrorBoundary).toBe(TablebasePanel);
  });

  it('should pass through all props correctly', () => {
    const mockOnMoveSelect = vi.fn();
    render(
      <TablebasePanelWithErrorBoundary
        tablebaseData={mockTablebaseData}
        onMoveSelect={mockOnMoveSelect}
        className="error-boundary-test"
      />
    );

    const panel = screen.getByTestId('tablebase-panel');
    expect(panel).toHaveClass('error-boundary-test');

    const moveButton = screen.getByText('e4').closest('[role="button"]');
    fireEvent.click(moveButton!);
    expect(mockOnMoveSelect).toHaveBeenCalledWith('e4');
  });
});
