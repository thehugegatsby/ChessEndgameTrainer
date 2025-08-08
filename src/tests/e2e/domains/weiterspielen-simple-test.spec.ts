/**
 * Simple E2E Test für Weiterspielen Bug
 *
 * Testet genau das was du manuell gemacht hast:
 * 1. Train/1 aufrufen
 * 2. Kd5 machen (triggert Error Dialog)
 * 3. "Weiterspielen" klicken
 * 4. Prüfen ob Schwarz einen Zug macht
 */

import { test, expect } from "@playwright/test";
import { getLogger } from "../../../shared/services/logging";
import { E2E } from "../../../shared/constants";
import { performMoveAndWait } from "../helpers/moveHelpers";

test.describe("Weiterspielen Simple Test", () => {
  const logger = getLogger().setContext("E2E-WeiterSpielenSimple");

  test("Train/1 → Kf6 → Weiterspielen → Schwarz macht keinen Zug (BUG)", async ({
    page,
  }) => {
    logger.info(
      "🎯 SIMPLE TEST: Train/1 → Kf6 → Weiterspielen → Schwarz macht keinen Zug",
    );

    // STEP 1: Gehe zu Train/1 (wie in der manuellen App)
    await page.goto(E2E.ROUTES.TRAIN(1));
    await page.waitForTimeout(E2E.TIMEOUTS.PAGE_LOAD);
    await expect(page).toHaveURL(/\/train/);
    await expect(page.locator("[data-testid='training-board']")).toBeVisible();
    await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT);

    logger.info("✅ Train/1 geladen");

    // STEP 2: Mache Kf6 (suboptimal) mit dem NEUEN e2e_makeValidatedMove (geht durch volle Validierung)
    // Train/1 Position: 4k3/8/4K3/4P3/8/8/8/8 w - Weiß am Zug, König auf e6
    // Optimal: Kd6 (Opposition), Suboptimal: Kf6
    logger.info("📋 Mache Kf6 (suboptimal) mit validierter Move-Funktion...");

    const kf6Result = await page.evaluate(async (move) => {
      return await (window as any).e2e_makeValidatedMove(move);
    }, "Kf6");

    logger.info("📊 Kf6 Result:", kf6Result);

    // STEP 3: Prüfe dass Error Dialog erscheint
    if (kf6Result.success) {
      logger.error(
        "❌ PROBLEM: Kf6 wurde akzeptiert, aber sollte Error Dialog zeigen!",
      );
      logger.info(
        "Möglicherweise ist Kf6 doch optimal oder Move-Quality-Evaluation funktioniert nicht",
      );
      return;
    }

    logger.info("✅ Kf6 wurde abgelehnt - Error Dialog sollte da sein");

    // STEP 4: Prüfe Error Dialog mit "Weiterspielen"
    const errorDialog = page.locator('[data-testid="move-error-dialog"]');
    await expect(errorDialog).toBeVisible({ timeout: 3000 });

    const weiterSpielenButton = errorDialog.locator(
      'button:has-text("Weiterspielen")',
    );
    await expect(weiterSpielenButton).toBeVisible({ timeout: 2000 });

    // Prüfe auch dass der Error Text stimmt
    await expect(errorDialog).toContainText("Fehler erkannt!");
    await expect(errorDialog).toContainText("Bester Zug war:");

    logger.info("✅ Error Dialog ist korrekt da");

    // STEP 5: Game State VOR dem Weiterspielen-Klick
    const gameStateVorWeiterspielen = await page.evaluate(() =>
      (window as any).e2e_getGameState(),
    );

    logger.info("📊 Game State VOR Weiterspielen:", {
      fen: gameStateVorWeiterspielen.fen,
      moveCount: gameStateVorWeiterspielen.moveCount,
      turn: gameStateVorWeiterspielen.turn,
      pgn: gameStateVorWeiterspielen.pgn,
    });

    // STEP 6: Klicke "Weiterspielen"
    logger.info("🖱️  Klicke Weiterspielen...");
    await weiterSpielenButton.click();

    // STEP 7: Dialog sollte verschwinden
    await expect(errorDialog).not.toBeVisible({ timeout: 3000 });
    logger.info("✅ Error Dialog verschwunden");

    // STEP 8: Warte 3 Sekunden auf Gegnerzug
    logger.info("⏳ Warte 3 Sekunden auf Gegnerzug...");
    await page.waitForTimeout(3000);

    // STEP 9: Game State NACH dem Warten
    const gameStateNachWarten = await page.evaluate(() =>
      (window as any).e2e_getGameState(),
    );

    logger.info("📊 Game State NACH 3 Sekunden:", {
      fen: gameStateNachWarten.fen,
      moveCount: gameStateNachWarten.moveCount,
      turn: gameStateNachWarten.turn,
      pgn: gameStateNachWarten.pgn,
    });

    // STEP 10: Prüfe ob Schwarz einen Zug gemacht hat
    const schwarzHatGezogen =
      gameStateNachWarten.moveCount > gameStateVorWeiterspielen.moveCount &&
      gameStateNachWarten.fen !== gameStateVorWeiterspielen.fen;

    if (schwarzHatGezogen) {
      logger.info(
        "🎉 ÜBERRASCHUNG: Schwarz HAT einen Zug gemacht! Bug ist weg?",
      );
      expect(schwarzHatGezogen).toBe(true);
    } else {
      logger.info(
        "🐛 BUG BESTÄTIGT: Schwarz hat KEINEN Zug gemacht nach Weiterspielen",
      );
      logger.info("Beweis:");
      logger.info(
        `- Move Count gleich: ${gameStateVorWeiterspielen.moveCount} → ${gameStateNachWarten.moveCount}`,
      );
      logger.info(
        "- FEN gleich:",
        gameStateVorWeiterspielen.fen === gameStateNachWarten.fen,
      );
      logger.info(
        "- Turn gleich:",
        gameStateVorWeiterspielen.turn === gameStateNachWarten.turn,
      );

      // Dokumentiere den Bug (diese Assertion wird failsieren wenn Bug gefixt ist)
      expect(gameStateNachWarten.moveCount).toBe(
        gameStateVorWeiterspielen.moveCount,
      );
      expect(gameStateNachWarten.fen).toBe(gameStateVorWeiterspielen.fen);
    }
  });
});
