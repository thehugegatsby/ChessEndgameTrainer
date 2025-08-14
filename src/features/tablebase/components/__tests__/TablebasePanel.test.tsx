import { describe, it, expect, beforeEach, vi } from 'vitest';
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

    expect(screen.getByTestId("tablebase-panel")?.isConnected).toBe(true);
    expect(screen.getByText("Tablebase")?.isConnected).toBe(true);
    expect(screen.getByText("4 moves")?.isConnected).toBe(true);
  });

  it("should render move groups correctly", () => {
    render(
      <TablebasePanel
        tablebaseData={mockTablebaseData}
        onMoveSelect={mockOnMoveSelect}
      />,
    );

    // Check for winning moves group
    expect(screen.getByText("Winning Moves")?.isConnected).toBe(true);
    expect(screen.getByText("e4")?.isConnected).toBe(true);
    expect(screen.getByText("f4")?.isConnected).toBe(true);

    // Check for drawing moves group
    expect(screen.getByText("Drawing Moves")?.isConnected).toBe(true);
    expect(screen.getByText("e5")?.isConnected).toBe(true);

    // Check for losing moves group (collapsed by default)
    expect(screen.getByText("Losing Moves")?.isConnected).toBe(true);

    // Click to expand losing moves group
    const losingMovesHeader = screen
      .getByText("Losing Moves")
      .closest('[role="button"]');
    fireEvent.click(losingMovesHeader!);

    // Now f6 should be visible
    expect(screen.getByText("f6")?.isConnected).toBe(true);
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

    expect(screen.getByText("Tablebase")?.isConnected).toBe(true);
    // Should show loading text
    expect(screen.getByText("Lade Analyse...")?.isConnected).toBe(true);
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

    expect(screen.getByText("Tablebase")?.isConnected).toBe(true);
    expect(
      screen.getByText("Keine Tablebase-Daten verfügbar")?.isConnected,
    ).toBe(true);
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

    expect(screen.getByText("Tablebase")?.isConnected).toBe(true);
    expect(
      screen.getByText("Warte auf Tablebase-Analyse...")?.isConnected,
    ).toBe(true);
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
    expect(winningMovesSection?.isConnected).toBe(true);

    // Check counts are displayed correctly
    const winningCount = screen
      .getByText("Winning Moves")
      .parentElement?.querySelector(".text-xs");
    expect(winningCount.textContent).toBe("2");

    const drawingMovesSection = screen.getByText("Drawing Moves");
    expect(drawingMovesSection?.isConnected).toBe(true);
    const drawingCount =
      drawingMovesSection.parentElement?.querySelector(".text-xs");
    expect(drawingCount.textContent).toBe("1");

    const losingMovesSection = screen.getByText("Losing Moves");
    expect(losingMovesSection?.isConnected).toBe(true);
    const losingCount =
      losingMovesSection.parentElement?.querySelector(".text-xs");
    expect(losingCount.textContent).toBe("1");
  });

  it("should handle compact mode", () => {
    render(
      <TablebasePanel
        tablebaseData={mockTablebaseData}
        onMoveSelect={mockOnMoveSelect}
        compact={true}
      />,
    );

    expect(screen.getByTestId("tablebase-panel")?.isConnected).toBe(true);
    expect(screen.getByText("Tablebase")?.isConnected).toBe(true);

    // Statistics should not be visible in compact mode
    const statisticsSection = screen.queryByText("Winning");
    expect(statisticsSection).toBeNull();
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
    expect(selectedMoveElement.classList.contains(
      "bg-blue-50",
      "dark:bg-blue-900/20",
    )).toBe(true);
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

      expect(screen.getByText('Tablebase')?.isConnected).toBe(true);
      expect(screen.getByText('Analyse konnte nicht geladen werden')?.isConnected).toBe(true);
      
      // Error state doesn't have data-testid, just the CSS class
      const panel = screen.getByText('Tablebase').closest('.tablebase-panel');
      expect(panel?.isConnected).toBe(true);
      
      // Should not show move groups when there's an error
      expect(screen.queryByText('Winning Moves')).toBeNull();
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
      expect(errorElement.classList.contains('text-sm', 'text-red-600', 'dark:text-red-400')).toBe(true);
      expect(errorElement.classList.contains('bg-red-50', 'dark:bg-red-900/20')).toBe(true);
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
      expect(panel.classList.contains('tablebase-panel', 'custom-panel-class')).toBe(true);
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
      expect(screen.getByTestId('tablebase-panel')?.isConnected).toBe(true);
      
      // No moves should have selected styling
      const moveButtons = screen.getAllByRole('button');
      moveButtons.forEach(button => {
        expect(button.classList.contains('bg-blue-50')).toBe(false);
      });
    });

    it('should work with all default props', () => {
      render(
        <TablebasePanel
          tablebaseData={mockTablebaseData}
          onMoveSelect={mockOnMoveSelect}
        />
      );

      expect(screen.getByTestId('tablebase-panel')?.isConnected).toBe(true);
      expect(screen.getByText('Tablebase')?.isConnected).toBe(true);
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

      expect(screen.getByText('Warte auf Tablebase-Analyse...')?.isConnected).toBe(true);
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

      expect(screen.getByText('Tablebase')?.isConnected).toBe(true);
      expect(screen.getByText('1 moves')?.isConnected).toBe(true);
      expect(screen.getByText('e4')?.isConnected).toBe(true);
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

      expect(screen.getByText('Winning Moves')?.isConnected).toBe(true);
      expect(screen.queryByText('Drawing Moves')).toBeNull();
      expect(screen.queryByText('Losing Moves')).toBeNull();
      expect(screen.getByText('2 moves')?.isConnected).toBe(true);
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

      expect(screen.queryByText('Winning Moves')).toBeNull();
      expect(screen.getByText('Drawing Moves')?.isConnected).toBe(true);
      expect(screen.queryByText('Losing Moves')).toBeNull();
      expect(screen.getByText('1 moves')?.isConnected).toBe(true);
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

      expect(screen.queryByText('Winning Moves')).toBeNull();
      expect(screen.queryByText('Drawing Moves')).toBeNull();
      expect(screen.getByText('Losing Moves')?.isConnected).toBe(true);
      expect(screen.getByText('1 moves')?.isConnected).toBe(true);
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
      expect(panel.classList.contains('loading-custom-class')).toBe(true);
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
      expect(screen.getByText('Analyse konnte nicht geladen werden')?.isConnected).toBe(true);
      expect(screen.queryByText('Lade Analyse...')).toBeNull();
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

      expect(screen.getByText('Analyse konnte nicht geladen werden')?.isConnected).toBe(true);
      expect(screen.queryByText('Keine Tablebase-Daten verfügbar')).toBeNull();
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

      expect(screen.getByText('Lade Analyse...')?.isConnected).toBe(true);
      expect(screen.queryByText('Keine Tablebase-Daten verfügbar')).toBeNull();
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
      expect(screen.getByText('Analyse konnte nicht geladen werden').classList.contains('text-red-600')).toBe(true);

      // Loading state
      rerender(
        <TablebasePanel
          tablebaseData={mockTablebaseData}
          onMoveSelect={mockOnMoveSelect}
          loading={true}
        />
      );
      expect(screen.getByText('Lade Analyse...').classList.contains('text-gray-500')).toBe(true);

      // No tablebase data
      const noTablebaseData: TablebaseData = { isTablebasePosition: false };
      rerender(
        <TablebasePanel
          tablebaseData={noTablebaseData}
          onMoveSelect={mockOnMoveSelect}
        />
      );
      expect(screen.getByText('Keine Tablebase-Daten verfügbar').classList.contains('text-amber-600')).toBe(true);

      // Waiting for analysis
      const emptyMovesData: TablebaseData = { isTablebasePosition: true, topMoves: [] };
      rerender(
        <TablebasePanel
          tablebaseData={emptyMovesData}
          onMoveSelect={mockOnMoveSelect}
        />
      );
      expect(screen.getByText('Warte auf Tablebase-Analyse...').classList.contains('text-green-600')).toBe(true);
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
    expect(panel?.isConnected).toBe(true);
    expect(panel.classList.contains('compact-tablebase-panel')).toBe(true);
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
    expect(panel.classList.contains('compact-tablebase-panel', 'custom-compact-class')).toBe(true);
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

    expect(screen.getByText('Tablebase')?.isConnected).toBe(true);
    expect(screen.getByText('1 moves')?.isConnected).toBe(true);

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

    expect(screen.getByTestId('tablebase-panel')?.isConnected).toBe(true);
    expect(screen.getByText('Tablebase')?.isConnected).toBe(true);
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
    expect(panel.classList.contains('error-boundary-test')).toBe(true);

    const moveButton = screen.getByText('e4').closest('[role="button"]');
    fireEvent.click(moveButton!);
    expect(mockOnMoveSelect).toHaveBeenCalledWith('e4');
  });
});
