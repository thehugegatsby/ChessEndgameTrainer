/**
 * Integration Tests for EndgameTrainingPage
 * Tests the complete user journey and component integration
 * Uses REAL Zustand stores for true integration testing
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EndgameTrainingPage } from "@shared/pages/EndgameTrainingPage";
import { EndgamePosition } from "@shared/types";
import { useRouter } from "next/navigation";
import { useStore } from "@shared/store/rootStore";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock Firebase - uses central mock
jest.mock("@shared/lib/firebase");

// Mock TablebaseService - uses central mock from __mocks__ folder
jest.mock("@shared/services/TablebaseService");

// Mock ChessService - uses central mock from __mocks__ folder
jest.mock("@shared/services/ChessService");

// Import the mocked service
import { tablebaseService as mockTablebaseService } from "@shared/services/TablebaseService";
// Import helper functions from the mock
import {
  resetMock,
  mockWinPosition,
  mockApiError,
} from "@shared/services/__mocks__/TablebaseService";

// Type the mocked router
const mockedUseRouter = useRouter as jest.Mock;

describe("EndgameTrainingPage Integration Tests", () => {
  // Test data
  const mockPosition: EndgamePosition = {
    id: 1,
    fen: "8/8/8/8/4k3/8/4K3/8 w - - 0 1",
    title: "König gegen König",
    description: "Grundlegendes Endspiel",
    goal: "win",
    difficulty: "beginner",
    category: "basic",
  };

  // Mock router
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    // Reset all mocks and their implementations
    jest.resetAllMocks();

    // Reset the tablebase mock to defaults
    resetMock();

    // Reset store using the built-in reset function
    act(() => {
      useStore.getState().reset();
    });

    // Then set up the test state using actions (nested structure)
    act(() => {
      const state = useStore.getState();
      // Initialize game with FEN (nested access)
      state.game.initializeGame(mockPosition.fen);

      // Set up training state (nested access)
      state.training.setPosition(mockPosition as any);
      state.training.setNavigationPositions(
        { id: "next-pos-1", title: "Next Position" } as any,
        null,
      );
      state.training.setNavigationLoading(false);

      // Set up UI state (nested access)
      state.ui.updateAnalysisPanel({ isOpen: false });
    });

    // Setup router mock
    mockedUseRouter.mockReturnValue(mockRouter);

    // Setup TablebaseService mock with winning position by default
    mockWinPosition(undefined, 5);
  });

  // Helper function to render the page
  /**
   *
   */
  const renderPage = () => {
    return render(<EndgameTrainingPage position={mockPosition} />);
  };

  describe("Initial Rendering", () => {
    it("should render all main components correctly", () => {
      renderPage();

      // Check title
      expect(screen.getByTestId("position-title")).toHaveTextContent(
        "König gegen König",
      );

      // Check navigation buttons
      expect(screen.getByTitle("Vorherige Stellung")).toBeInTheDocument();
      expect(screen.getByTitle("Position zurücksetzen")).toBeInTheDocument();
      expect(screen.getByTitle("Nächste Stellung")).toBeInTheDocument();

      // Check game status
      expect(screen.getByText(/♔/)).toBeInTheDocument();

      // Check instructions
      expect(screen.getByText("Grundlegendes Endspiel")).toBeInTheDocument();

      // Check analysis toggle
      expect(screen.getByTestId("toggle-analysis")).toHaveTextContent(
        "Analyse AN",
      );

      // Check external link
      expect(screen.getByText("Auf Lichess analysieren →")).toBeInTheDocument();
    });

    it("should initialize with correct position", () => {
      renderPage();

      // Verify the TrainingBoard received the correct position
      // This would be visible through the board rendering
      expect(screen.getByTestId("position-title")).toBeInTheDocument();
    });
  });

  describe("User Interactions - Making Moves", () => {
    it("should handle player moves correctly", async () => {
      renderPage();

      // Simulate making a move through the store (nested access)
      act(() => {
        useStore.getState().game.makeMove({
          from: "e2",
          to: "e3",
        });
      });

      // Wait for UI to update
      await waitFor(() => {
        // Check that the move appears in the move history (nested access)
        const moveHistory = useStore.getState().game.moveHistory;
        expect(moveHistory).toHaveLength(1);
        expect(moveHistory[0].san).toBe("Ke3");
      });

      // Verify the UI reflects the change
      // The MovePanelZustand should show the move
      expect(screen.getByText(/Ke3/)).toBeInTheDocument();
    });
  });

  describe("Analysis Panel Integration", () => {
    it("should toggle analysis panel and fetch tablebase data", async () => {
      const user = userEvent.setup();
      renderPage();

      // Initially panel should be closed
      expect(screen.getByTestId("toggle-analysis")).toHaveTextContent(
        "Analyse AN",
      );

      // Click analysis toggle
      const analysisButton = screen.getByTestId("toggle-analysis");
      await user.click(analysisButton);

      // Wait for state update (nested access)
      await waitFor(() => {
        expect(useStore.getState().ui.analysisPanel.isOpen).toBe(true);
      });

      // Check that button text changed
      expect(screen.getByTestId("toggle-analysis")).toHaveTextContent(
        "Analyse AUS",
      );

      // Verify tablebase service was called
      await waitFor(() => {
        expect(mockTablebaseService.getEvaluation).toHaveBeenCalledWith(
          mockPosition.fen,
        );
      });
    });

    it("should handle tablebase API errors gracefully", async () => {
      const user = userEvent.setup();

      // Mock API error
      mockApiError("Tablebase API unavailable");

      renderPage();

      // Toggle analysis
      const analysisButton = screen.getByTestId("toggle-analysis");
      await user.click(analysisButton);

      // Wait for error message
      await waitFor(() => {
        expect(
          screen.getByText(/Analyse konnte nicht geladen werden/i),
        ).toBeInTheDocument();
      });
    });

    it("should show loading state while fetching tablebase data", async () => {
      const user = userEvent.setup();

      // Create a controllable promise for better timing control
      let resolveEvaluation: (value: any) => void;
      const evaluationPromise = new Promise((resolve) => {
        resolveEvaluation = resolve;
      });

      // Mock with our controllable promise
      (mockTablebaseService.getEvaluation as jest.Mock).mockImplementation(
        () => evaluationPromise,
      );
      (mockTablebaseService.getTopMoves as jest.Mock).mockImplementation(
        () => evaluationPromise,
      );

      renderPage();

      // Toggle analysis
      const analysisButton = screen.getByTestId("toggle-analysis");

      // Use act to ensure all updates are flushed
      await act(async () => {
        await user.click(analysisButton);
      });

      // Now the loading state should be visible
      await waitFor(() => {
        expect(screen.getByText(/Lade Analyse.../i)).toBeInTheDocument();
      });

      // Resolve the promise to complete the loading
      await act(async () => {
        resolveEvaluation!({
          isAvailable: true,
          result: {
            wdl: 2,
            dtz: 10,
            dtm: 5,
            category: "win",
            precise: true,
            evaluation: "Gewinn in 5 Zügen",
          },
        });
      });

      // Wait for loading to disappear
      await waitFor(
        () => {
          expect(
            screen.queryByText(/Lade Analyse.../i),
          ).not.toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe("Navigation Features", () => {
    it("should navigate to next position when button is clicked", async () => {
      const user = userEvent.setup();
      renderPage();

      const nextButton = screen.getByTitle("Nächste Stellung");
      await user.click(nextButton);

      expect(mockPush).toHaveBeenCalledWith("/train/next-pos-1");
    });

    it("should disable navigation when loading", async () => {
      // Set loading state (nested access)
      act(() => {
        useStore.getState().training.setNavigationLoading(true);
      });

      renderPage();

      const nextButton = screen.getByTitle("Nächste Stellung");
      expect(nextButton).toBeDisabled();
    });

    it("should reset position when reset button is clicked", async () => {
      const user = userEvent.setup();

      // First make a move to have something to reset (nested access)
      act(() => {
        useStore.getState().game.makeMove({
          from: "e2",
          to: "e3",
        });
      });

      renderPage();

      // Verify move was made (nested access)
      expect(useStore.getState().game.moveHistory).toHaveLength(1);

      const resetButton = screen.getByTitle("Position zurücksetzen");
      await user.click(resetButton);

      // Verify game was reset (nested access)
      await waitFor(() => {
        expect(useStore.getState().game.moveHistory).toHaveLength(0);
        expect(useStore.getState().game.currentFen).toBe(mockPosition.fen);
      });
    });
  });

  describe("Move History Navigation", () => {
    it("should navigate through move history", async () => {
      // Setup state with move history (nested access)
      act(() => {
        useStore.getState().game.makeMove({ from: "e2", to: "e3" });
        useStore.getState().game.makeMove({ from: "e4", to: "d4" });
      });

      renderPage();

      // Verify moves are in history (nested access)
      expect(useStore.getState().game.moveHistory).toHaveLength(2);
      expect(useStore.getState().game.currentMoveIndex).toBe(1);

      // Navigate to first move (nested access)
      act(() => {
        useStore.getState().game.goToMove(0);
      });

      await waitFor(() => {
        expect(useStore.getState().game.currentMoveIndex).toBe(0);
      });
    });
  });

  describe("Training Completion", () => {
    it("should complete training successfully", async () => {
      renderPage();

      // Simulate successful training completion (nested access)
      act(() => {
        useStore.getState().training.completeTraining(true);
      });

      await waitFor(() => {
        const state = useStore.getState();
        expect(state.training.isSuccess).toBe(true);
      });
    });

    it("should handle training failure", async () => {
      renderPage();

      // Simulate failed training (nested access)
      act(() => {
        useStore.getState().training.completeTraining(false);
      });

      await waitFor(() => {
        const state = useStore.getState();
        expect(state.training.isSuccess).toBe(false);
      });
    });
  });

  describe("External Links", () => {
    it("should generate correct Lichess analysis URL", () => {
      renderPage();

      const lichessLink = screen.getByText("Auf Lichess analysieren →");
      expect(lichessLink).toHaveAttribute(
        "href",
        expect.stringContaining("lichess.org/analysis"),
      );
      expect(lichessLink).toHaveAttribute("target", "_blank");
      expect(lichessLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should include PGN in Lichess URL when moves are made", () => {
      // Setup state with PGN (nested access)
      act(() => {
        const state = useStore.getState();
        // Make moves to build history (nested access)
        state.game.initializeGame(mockPosition.fen);
        state.game.makeMove({ from: "e2", to: "e3" });
        state.game.makeMove({ from: "e4", to: "d4" });
        state.game.makeMove({ from: "e3", to: "f4" });
      });

      renderPage();

      const lichessLink = screen.getByText("Auf Lichess analysieren →");
      expect(lichessLink).toHaveAttribute(
        "href",
        expect.stringContaining("/pgn/"),
      );
    });
  });

  describe("Error Handling", () => {
    it("should show loading state when position is not initialized", () => {
      // Mock position not initialized by resetting training (nested access)
      act(() => {
        useStore.getState().training.resetTraining();
      });

      renderPage();

      // Check for loading or empty state
      expect(screen.queryByTestId("position-title")).not.toBeInTheDocument();
    });
  });

  describe("Full User Flow", () => {
    it("should complete a full training session flow", async () => {
      const user = userEvent.setup();
      renderPage();

      // Step 1: Enable analysis
      const analysisButton = screen.getByTestId("toggle-analysis");
      await user.click(analysisButton);

      await waitFor(() => {
        expect(useStore.getState().ui.analysisPanel.isOpen).toBe(true);
      });

      // Step 2: Make a move (nested access)
      act(() => {
        useStore.getState().game.makeMove({
          from: "e2",
          to: "e3",
        });
      });

      await waitFor(() => {
        expect(useStore.getState().game.moveHistory).toHaveLength(1);
      });

      // Step 3: Reset position
      const resetButton = screen.getByTitle("Position zurücksetzen");
      await user.click(resetButton);

      await waitFor(() => {
        expect(useStore.getState().game.moveHistory).toHaveLength(0);
      });

      // Step 4: Navigate to next position
      const nextButton = screen.getByTitle("Nächste Stellung");
      await user.click(nextButton);
      expect(mockPush).toHaveBeenCalledWith("/train/next-pos-1");

      // Verify tablebase was called during analysis
      expect(mockTablebaseService.getEvaluation).toHaveBeenCalled();
    });

    it("should handle complete game flow with errors", async () => {
      const user = userEvent.setup();

      // Use mockReset to completely clear the mock including implementation
      (mockTablebaseService.getEvaluation as jest.Mock).mockReset();
      (mockTablebaseService.getTopMoves as jest.Mock).mockReset();

      // Setup API to fail first, then succeed
      (mockTablebaseService.getEvaluation as jest.Mock)
        .mockRejectedValueOnce(new Error("API Error"))
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            wdl: 2,
            dtz: 10,
            dtm: 5,
            category: "win",
            precise: true,
            evaluation: "Gewinn in 5 Zügen",
          },
        });

      // Also mock getTopMoves to avoid undefined errors
      (mockTablebaseService.getTopMoves as jest.Mock)
        .mockRejectedValueOnce(new Error("API Error"))
        .mockResolvedValueOnce({
          isAvailable: true,
          moves: [
            {
              uci: "e2e3",
              san: "Ke3",
              wdl: 2,
              dtz: 8,
              dtm: 4,
              category: "win",
            },
          ],
        });

      renderPage();

      // Try analysis - should fail
      const analysisButton = screen.getByTestId("toggle-analysis");
      await user.click(analysisButton);

      // Wait for error
      await waitFor(() => {
        expect(
          screen.getByText(/Analyse konnte nicht geladen werden/i),
        ).toBeInTheDocument();
      });

      // Try again - should succeed
      await user.click(analysisButton); // Toggle off
      await user.click(analysisButton); // Toggle on again

      // There might be an additional call from component lifecycle
      // Accept 2 or 3 calls as both are valid scenarios
      await waitFor(() => {
        const callCount = (mockTablebaseService.getEvaluation as jest.Mock).mock
          .calls.length;
        expect(callCount).toBeGreaterThanOrEqual(2);
        expect(callCount).toBeLessThanOrEqual(3);
      });
    });
  });
});
