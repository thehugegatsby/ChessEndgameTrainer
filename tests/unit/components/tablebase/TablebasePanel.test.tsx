/**
 * Unit tests for TablebasePanel component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TablebasePanel } from "@shared/components/tablebase/TablebasePanel";
import { type TablebaseData } from "@shared/types/evaluation";

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

  const mockOnMoveSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
    // Should show loading animation
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
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
});
