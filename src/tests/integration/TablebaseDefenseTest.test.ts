/**
 * Direct test of TablebaseService DTM sorting for defense
 */

import { tablebaseService } from "@shared/services/TablebaseService";
import { getTablebaseDefensePosition } from "../fixtures/fenPositions";

describe("TablebaseService Defense Sorting", () => {
  it("Should return moves sorted by DTM for losing positions", async () => {
    // Use centralized test position for DTM defense sorting
    const defensePosition = getTablebaseDefensePosition();
    const fen = defensePosition.fen;

    console.log("\n=== Testing TablebaseService directly ===");
    console.log("FEN:", fen);

    // Get top 10 moves from tablebase
    const result = await tablebaseService.getTopMoves(fen, 10);

    console.log("API returned:", result.moves?.length, "moves");

    if (result.isAvailable && result.moves) {
      console.log("\nMoves returned by TablebaseService:");
      result.moves.forEach((move, index) => {
        console.log(
          `  ${index + 1}. ${move.san}: DTM ${move.dtm}, WDL ${move.wdl}`,
        );
      });

      // Check if moves are sorted correctly for losing position
      // For losing positions (WDL < 0), moves should be sorted by DTM descending (highest DTM first)
      if (result.moves.length > 1 && result.moves[0].wdl < 0) {
        const firstMoveDtm = Math.abs(result.moves[0].dtm || 0);
        const secondMoveDtm = Math.abs(result.moves[1].dtm || 0);

        console.log("\nFirst move DTM:", firstMoveDtm);
        console.log("Second move DTM:", secondMoveDtm);
        console.log(
          "Is correctly sorted for defense?",
          firstMoveDtm >= secondMoveDtm,
        );

        // The first move should have the highest DTM (best defense)
        expect(firstMoveDtm).toBeGreaterThanOrEqual(secondMoveDtm);
      }

      // Check if Kd7 (DTM -27) is ranked first
      const kd7Move = result.moves.find((m) => m.san === "Kd7");
      if (kd7Move) {
        console.log("\nKd7 found with DTM:", kd7Move.dtm);
        console.log("Is Kd7 the first move?", result.moves[0].san === "Kd7");
      }
    } else {
      console.log("No moves available from tablebase");
    }
  });

  it("Should test the actual Lichess API response", async () => {
    // This will make a real API call to understand what we're getting
    const defensePosition = getTablebaseDefensePosition();
    const fen = defensePosition.fen;

    try {
      // Make direct API call
      const response = await fetch(
        `https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(fen)}`,
      );
      const data = await response.json();

      console.log("\n=== Direct Lichess API Response ===");
      console.log("Category:", data.category);
      console.log("Moves count:", data.moves?.length);

      if (data.moves) {
        console.log("\nAll moves from API:");
        data.moves.forEach((move: any) => {
          console.log(
            `  ${move.san}: DTM ${move.dtm}, DTZ ${move.dtz}, Category: ${move.category}`,
          );
        });
      }
    } catch (error) {
      console.log("Could not fetch from Lichess API:", error);
    }
  });
});
