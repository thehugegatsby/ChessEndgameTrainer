/**
 * @file Generic E2E Test Framework for Chess Move Sequences
 *
 * This framework provides a declarative way to test chess move sequences
 * with various expectations like toast messages, store state changes,
 * modal interactions, and training completion status.
 *
 * @example
 * ```typescript
 * const runner = new SequenceRunner(page);
 * await runner.executeSequence({
 *   name: "Pawn Promotion Test",
 *   moves: ["e6-d6", "e8-f7", "e7-e8=Q"],
 *   expectations: [
 *     expectation.successToast("Promotion!", 2),
 *     expectation.trainingSuccess()
 *   ]
 * });
 * ```
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { Page } from "@playwright/test";

/**
 * Types of expectations that can be verified during move sequence testing
 */
export type ExpectationType =
  | "toast"
  | "evaluation"
  | "modal"
  | "store"
  | "completion"
  | "dialog";

/**
 * Types of toast notifications in the application
 */
export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Configuration interface for a single expectation to be verified during testing
 *
 * @interface Expectation
 * @example
 * ```typescript
 * const expectation: Expectation = {
 *   type: 'toast',
 *   moveIndex: 2, // Check after 3rd move (0-indexed)
 *   data: {
 *     message: 'Great move!',
 *     toastType: 'success',
 *     timeout: 3000
 *   }
 * };
 * ```
 */
export interface Expectation {
  /** The type of expectation to verify */
  type: ExpectationType;

  /**
   * After which move (0-indexed) to check this expectation.
   * If undefined, expectation is checked at the end of the sequence.
   */
  moveIndex?: number;

  /** Configuration data specific to the expectation type */
  data: {
    // Toast expectations
    /** Text content to look for in toast message (partial match) */
    message?: string;
    /** Expected type of toast notification */
    toastType?: ToastType;

    // Evaluation expectations
    /** Expected best move in chess notation */
    bestMove?: string;
    /** Minimum score threshold for position evaluation */
    scoreThreshold?: number;

    // Modal expectations
    /** Expected modal type/identifier */
    modalType?: string;
    /** Whether modal should be open (true) or closed (false) */
    modalOpen?: boolean;

    // Store state expectations
    /** Dot-notation path to store property (e.g., 'training.isSuccess') */
    storePath?: string;
    /** Expected value at the store path */
    expectedValue?: unknown;

    // Completion expectations
    /** Expected training completion success status */
    isSuccess?: boolean;
    /** Expected training completion status string */
    completionStatus?: string;

    // Dialog expectations
    /** Type of dialog expected (e.g., 'moveSuccess', 'moveError') */
    dialogType?: string;
    /** Expected promotion piece text in dialog */
    promotionPiece?: string;
    /** Expected move description text in dialog */
    moveDescription?: string;
    /** Whether dialog should be open (true) or closed (false) */
    dialogOpen?: boolean;

    // General
    /** Timeout in milliseconds for this expectation (default: 5000) */
    timeout?: number;
  };
}

/**
 * Configuration interface for a complete move sequence test scenario
 *
 * @interface SequenceConfig
 * @example
 * ```typescript
 * const promotionScenario: SequenceConfig = {
 *   name: "Pawn Promotion to Queen",
 *   description: "Tests automatic win detection on pawn promotion",
 *   moves: ["e6-d6", "e8-f7", "e7-e8=Q"],
 *   expectations: [
 *     expectation.successToast("Umwandlung in Dame", 2),
 *     expectation.trainingSuccess()
 *   ],
 *   setup: {
 *     startFen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
 *     mockTablebase: true
 *   }
 * };
 * ```
 */
export interface SequenceConfig {
  /** Human-readable name for the test scenario */
  name: string;

  /** Optional detailed description of what this scenario tests */
  description?: string;

  /**
   * Array of chess moves in coordinate notation (e.g., "e2-e4", "e7-e8=Q")
   * Moves are played in order, alternating between white and black
   */
  moves: string[];

  /** Array of expectations to verify during or after the move sequence */
  expectations: Expectation[];

  /** Optional setup configuration for the test scenario */
  setup?: {
    /** Starting FEN position (if different from default position 1) */
    startFen?: string;

    /** Whether to mock the tablebase API to return winning positions */
    mockTablebase?: boolean;
  };
}

/**
 * Main class for executing chess move sequences and verifying expectations
 *
 * @class SequenceRunner
 * @example
 * ```typescript
 * const runner = new SequenceRunner(page);
 * await runner.executeSequence(myTestScenario);
 * ```
 */
export class SequenceRunner {
  /**
   * Creates a new SequenceRunner instance
   *
   * @param page - Playwright page object for browser automation
   */
  constructor(private page: Page) {}

  /**
   * Execute a complete move sequence with expectations
   *
   * This is the main method that:
   * 1. Sets up the test environment (tablebase mocks, etc.)
   * 2. Plays each move in sequence
   * 3. Verifies expectations at specified points
   * 4. Reports success or failure with detailed error messages
   *
   * @param config - The test scenario configuration
   * @throws {Error} If any move fails or expectation is not met
   *
   * @example
   * ```typescript
   * await runner.executeSequence({
   *   name: "Basic Checkmate",
   *   moves: ["Qd1-h5", "Ng8-f6", "Qh5-f7#"],
   *   expectations: [
   *     expectation.successToast("Checkmate!", 2)
   *   ]
   * });
   * ```
   */
  async executeSequence(config: SequenceConfig): Promise<void> {
    console.log(`🎯 Executing sequence: ${config.name}`);
    if (config.description) {
      console.log(`📋 Description: ${config.description}`);
    }

    // Setup if needed
    if (config.setup?.mockTablebase) {
      await this.setupTablebaseMock();
    }

    console.log(`🏁 Playing ${config.moves.length} moves...`);

    // Play moves and check expectations
    for (let i = 0; i < config.moves.length; i++) {
      const move = config.moves[i];
      console.log(`Making move ${i + 1}/${config.moves.length}: ${move}`);

      // Play the move
      const result = await this.page.evaluate(async (moveStr) => {
        const result = await (window as any).e2e_makeMove(moveStr);
        console.log(`Move result:`, result);
        return result;
      }, move);

      if (!result.success) {
        throw new Error(`Move ${move} failed: ${JSON.stringify(result)}`);
      }

      // Check expectations for this specific move index
      await this.checkExpectationsForMove(config.expectations, i);

      // Short pause between moves
      await this.page.waitForTimeout(500);
    }

    // Check final expectations (no moveIndex specified)
    await this.checkFinalExpectations(config.expectations);

    console.log(`✅ Sequence "${config.name}" completed successfully`);
  }

  /**
   * Setup tablebase API mock for winning positions
   *
   * Configures the page to intercept tablebase API calls and return
   * winning evaluations for testing promotion scenarios.
   *
   * @private
   */
  private async setupTablebaseMock(): Promise<void> {
    await this.page.route("**/api/tablebase/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          category: "win",
          wdl: 2, // Win for white
          dtz: 5,
          dtm: 5,
          precise_dtz: true,
          checkmate: false,
          stalemate: false,
          variant_win: false,
          variant_loss: false,
          insufficient_material: false,
          moves: [], // Empty moves array for simplicity
        }),
      });
    });
  }

  /**
   * Check expectations that should trigger after a specific move
   *
   * @param expectations - All expectations for this sequence
   * @param moveIndex - Current move index (0-based)
   * @private
   */
  private async checkExpectationsForMove(
    expectations: Expectation[],
    moveIndex: number,
  ): Promise<void> {
    const relevantExpectations = expectations.filter(
      (exp) => exp.moveIndex === moveIndex,
    );

    for (const expectation of relevantExpectations) {
      console.log(
        `🔍 Checking expectation after move ${moveIndex + 1}: ${expectation.type}`,
      );
      await this.verifyExpectation(expectation);
    }
  }

  /**
   * Check expectations that should trigger at the end of the sequence
   *
   * @param expectations - All expectations for this sequence
   * @private
   */
  private async checkFinalExpectations(
    expectations: Expectation[],
  ): Promise<void> {
    const finalExpectations = expectations.filter(
      (exp) => exp.moveIndex === undefined,
    );

    // Give some time for final state to settle
    if (finalExpectations.length > 0) {
      await this.page.waitForTimeout(2000);
    }

    for (const expectation of finalExpectations) {
      console.log(`🔍 Checking final expectation: ${expectation.type}`);
      await this.verifyExpectation(expectation);
    }
  }

  /**
   * Verify a single expectation
   *
   * Dispatches to the appropriate verification method based on expectation type.
   *
   * @param exp - The expectation to verify
   * @throws {Error} If expectation verification fails
   * @private
   */
  private async verifyExpectation(exp: Expectation): Promise<void> {
    const timeout = exp.data.timeout || 5000;

    try {
      switch (exp.type) {
        case "toast":
          await this.verifyToast(exp.data, timeout);
          break;
        case "evaluation":
          await this.verifyEvaluation(exp.data, timeout);
          break;
        case "modal":
          await this.verifyModal(exp.data, timeout);
          break;
        case "store":
          await this.verifyStoreState(exp.data, timeout);
          break;
        case "completion":
          await this.verifyCompletion(exp.data, timeout);
          break;
        case "dialog":
          await this.verifyDialog(exp.data, timeout);
          break;
        default:
          throw new Error(`Unknown expectation type: ${exp.type}`);
      }
    } catch (error) {
      throw new Error(
        `Expectation failed (${exp.type}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Verify toast message expectation
   *
   * Waits for a toast message containing the specified text and type
   * to appear in the application's toast system.
   *
   * @param data - Toast expectation data
   * @param timeout - Maximum time to wait for toast (ms)
   * @throws {Error} If toast doesn't appear within timeout
   * @private
   */
  private async verifyToast(
    data: Expectation["data"],
    timeout: number,
  ): Promise<void> {
    const { message, toastType } = data;

    await this.page.waitForFunction(
      ({ message, toastType }) => {
        const store = (window as any).__zustand_store;
        if (!store) return false;

        const state = store.getState();
        const toasts = state.ui?.toasts || [];

        return toasts.some((toast: any) => {
          const messageMatch = message
            ? toast.message?.includes(message)
            : true;
          const typeMatch = toastType ? toast.type === toastType : true;
          return messageMatch && typeMatch;
        });
      },
      { message, toastType },
      { timeout },
    );

    console.log(`✅ Toast expectation met: ${message} (${toastType})`);
  }

  /**
   * Verify evaluation expectation
   *
   * @param data - Evaluation expectation data
   * @param timeout - Maximum time to wait (ms)
   * @param _data
   * @param _timeout
   * @todo Implement when evaluation data is exposed to E2E tests
   * @private
   */
  private async verifyEvaluation(
    _data: Expectation["data"],
    _timeout: number,
  ): Promise<void> {
    // TODO: Implement when we have evaluation data exposed
    console.log(`⚠️ Evaluation expectations not implemented yet`);
  }

  /**
   * Verify modal state expectation
   *
   * Checks if the correct modal is open/closed in the application.
   *
   * @param data - Modal expectation data
   * @param timeout - Maximum time to wait for modal state (ms)
   * @throws {Error} If modal state doesn't match within timeout
   * @private
   */
  private async verifyModal(
    data: Expectation["data"],
    timeout: number,
  ): Promise<void> {
    const { modalType, modalOpen } = data;

    await this.page.waitForFunction(
      ({ modalType, modalOpen }) => {
        const store = (window as any).__zustand_store;
        if (!store) return false;

        const state = store.getState();
        const currentModal = state.ui?.currentModal;

        if (modalOpen === false) {
          return currentModal === null;
        }

        if (modalType) {
          return currentModal === modalType;
        }

        return modalOpen ? currentModal !== null : true;
      },
      { modalType, modalOpen },
      { timeout },
    );

    console.log(`✅ Modal expectation met: ${modalType} open=${modalOpen}`);
  }

  /**
   * Verify store state expectation
   *
   * Checks if a specific store property has the expected value using
   * dot-notation path traversal (e.g., 'training.isSuccess').
   *
   * @param data - Store expectation data
   * @param timeout - Maximum time to wait for state change (ms)
   * @throws {Error} If store state doesn't match within timeout
   * @private
   */
  private async verifyStoreState(
    data: Expectation["data"],
    timeout: number,
  ): Promise<void> {
    const { storePath, expectedValue } = data;

    if (!storePath) {
      throw new Error("storePath required for store expectation");
    }

    await this.page.waitForFunction(
      ({ storePath, expectedValue }) => {
        const store = (window as any).__zustand_store;
        if (!store) return false;

        const state = store.getState();
        const actualValue = storePath
          .split(".")
          .reduce((obj, key) => obj?.[key], state);

        return JSON.stringify(actualValue) === JSON.stringify(expectedValue);
      },
      { storePath, expectedValue },
      { timeout },
    );

    console.log(
      `✅ Store expectation met: ${storePath} = ${JSON.stringify(expectedValue)}`,
    );
  }

  /**
   * Verify completion expectation
   *
   * Checks training completion status and success state.
   *
   * @param data - Completion expectation data
   * @param timeout - Maximum time to wait for completion (ms)
   * @throws {Error} If completion state doesn't match within timeout
   * @private
   */
  private async verifyCompletion(
    data: Expectation["data"],
    timeout: number,
  ): Promise<void> {
    const { isSuccess, completionStatus } = data;

    await this.page.waitForFunction(
      ({ isSuccess, completionStatus }) => {
        const store = (window as any).__zustand_store;
        if (!store) return false;

        const state = store.getState();

        if (isSuccess !== undefined) {
          const success = state.training?.isSuccess;
          if (success !== isSuccess) return false;
        }

        if (completionStatus !== undefined) {
          const status = state.training?.completionStatus;
          if (status !== completionStatus) return false;
        }

        return true;
      },
      { isSuccess, completionStatus },
      { timeout },
    );

    console.log(
      `✅ Completion expectation met: success=${isSuccess}, status=${completionStatus}`,
    );
  }

  /**
   * Verify dialog expectation
   *
   * Waits for a dialog with specified properties to appear or disappear
   * from the application's store state.
   *
   * @param data - Dialog expectation data
   * @param timeout - Maximum time to wait for dialog (ms)
   * @throws {Error} If dialog expectation is not met within timeout
   * @private
   */
  private async verifyDialog(
    data: Expectation["data"],
    timeout: number,
  ): Promise<void> {
    const { dialogType, promotionPiece, moveDescription, dialogOpen } = data;

    await this.page.waitForFunction(
      ({ dialogType, promotionPiece, moveDescription, dialogOpen }) => {
        const store = (window as any).__zustand_store;
        if (!store) return false;

        const state = store.getState();

        // Check moveSuccessDialog specifically
        if (dialogType === "moveSuccess") {
          const dialog = state.training?.moveSuccessDialog;

          // Check if dialog should be open or closed
          if (dialogOpen !== undefined) {
            const isOpen = dialog?.isOpen || false;
            if (isOpen !== dialogOpen) return false;
          }

          // If we expect it to be closed, that's enough
          if (dialogOpen === false) return true;

          // For open dialogs, check content
          if (dialog?.isOpen) {
            if (
              promotionPiece &&
              !dialog.promotionPiece?.includes(promotionPiece)
            )
              return false;
            if (
              moveDescription &&
              !dialog.moveDescription?.includes(moveDescription)
            )
              return false;
            return true;
          }

          return false;
        }

        // Add support for other dialog types in the future
        return false;
      },
      { dialogType, promotionPiece, moveDescription, dialogOpen },
      { timeout },
    );

    console.log(
      `✅ Dialog expectation met: type=${dialogType}, open=${dialogOpen}, piece=${promotionPiece}`,
    );
  }

  /**
   * Get current store state for debugging
   *
   * @returns Current Zustand store state or null if not available
   *
   * @example
   * ```typescript
   * const state = await runner.getStoreState();
   * console.log('Current toasts:', state.ui?.toasts);
   * ```
   */
  async getStoreState(): Promise<any> {
    return await this.page.evaluate(() => {
      const store = (window as any).__zustand_store;
      return store ? store.getState() : null;
    });
  }

  /**
   * Get current game state for debugging
   *
   * @returns Current chess game state (FEN, turn, etc.) or null if not available
   *
   * @example
   * ```typescript
   * const gameState = await runner.getGameState();
   * console.log('Current position:', gameState.fen);
   * ```
   */
  async getGameState(): Promise<any> {
    return await this.page.evaluate(async () => {
      return await (window as any).e2e_getGameState();
    });
  }
}

/**
 * Helper functions to create common expectations with sensible defaults
 *
 * @namespace expectation
 * @example
 * ```typescript
 * const expectations = [
 *   expectation.successToast("Great move!", 0),
 *   expectation.storeState("training.isSuccess", true),
 *   expectation.modalOpen("completion")
 * ];
 * ```
 */
export /**
 *
 */
const expectation = {
  /**
   * Create a success toast expectation
   *
   * @param message - Text to look for in the toast message (partial match)
   * @param moveIndex - After which move to check (0-indexed), undefined for end of sequence
   * @returns Configured expectation object
   *
   * @example
   * ```typescript
   * expectation.successToast("Promotion!", 8) // Check after 9th move
   * ```
   */
  successToast: (message: string, moveIndex?: number): Expectation => ({
    type: "toast",
    moveIndex,
    data: { message, toastType: "success" },
  }),

  /**
   * Create an error toast expectation
   *
   * @param message - Text to look for in the error toast
   * @param moveIndex - After which move to check (0-indexed)
   * @returns Configured expectation object
   */
  errorToast: (message: string, moveIndex?: number): Expectation => ({
    type: "toast",
    moveIndex,
    data: { message, toastType: "error" },
  }),

  /**
   * Create a store state expectation
   *
   * @param path - Dot-notation path to store property (e.g., 'training.isSuccess')
   * @param value - Expected value at that path
   * @param moveIndex - After which move to check (0-indexed)
   * @returns Configured expectation object
   *
   * @example
   * ```typescript
   * expectation.storeState("ui.currentModal", "completion")
   * ```
   */
  storeState: (
    path: string,
    value: unknown,
    moveIndex?: number,
  ): Expectation => ({
    type: "store",
    moveIndex,
    data: { storePath: path, expectedValue: value },
  }),

  /**
   * Create a training success expectation
   *
   * @param moveIndex - After which move to check (0-indexed)
   * @returns Configured expectation for successful training completion
   */
  trainingSuccess: (moveIndex?: number): Expectation => ({
    type: "completion",
    moveIndex,
    data: { isSuccess: true },
  }),

  /**
   * Create a modal open expectation
   *
   * @param modalType - Expected modal type/identifier
   * @param moveIndex - After which move to check (0-indexed)
   * @returns Configured expectation for open modal
   */
  modalOpen: (modalType: string, moveIndex?: number): Expectation => ({
    type: "modal",
    moveIndex,
    data: { modalType, modalOpen: true },
  }),

  /**
   * Create a modal closed expectation
   *
   * @param moveIndex - After which move to check (0-indexed)
   * @returns Configured expectation for closed modal
   */
  modalClosed: (moveIndex?: number): Expectation => ({
    type: "modal",
    moveIndex,
    data: { modalOpen: false },
  }),

  /**
   * Create a move success dialog expectation
   *
   * @param promotionPiece - Expected promotion piece text (e.g., "Dame", "Turm")
   * @param moveIndex - After which move to check (0-indexed), undefined for end of sequence
   * @returns Configured expectation for promotion success dialog
   *
   * @example
   * ```typescript
   * expectation.promotionSuccessDialog("Dame", 8) // Check after 9th move for Queen promotion
   * ```
   */
  promotionSuccessDialog: (
    promotionPiece: string,
    moveIndex?: number,
  ): Expectation => ({
    type: "dialog",
    moveIndex,
    data: {
      dialogType: "moveSuccess",
      dialogOpen: true,
      promotionPiece,
    },
  }),

  /**
   * Create a move success dialog expectation with move description
   *
   * @param promotionPiece - Expected promotion piece text (e.g., "Dame", "Turm")
   * @param moveDescription - Expected move description (e.g., "e8=Q+")
   * @param moveIndex - After which move to check (0-indexed), undefined for end of sequence
   * @returns Configured expectation for detailed promotion success dialog
   *
   * @example
   * ```typescript
   * expectation.promotionDialog("Dame", "e8=Q+", 8) // Check promotion dialog details
   * ```
   */
  promotionDialog: (
    promotionPiece: string,
    moveDescription: string,
    moveIndex?: number,
  ): Expectation => ({
    type: "dialog",
    moveIndex,
    data: {
      dialogType: "moveSuccess",
      dialogOpen: true,
      promotionPiece,
      moveDescription,
    },
  }),

  /**
   * Create a dialog closed expectation
   *
   * @param dialogType - Type of dialog that should be closed
   * @param moveIndex - After which move to check (0-indexed)
   * @returns Configured expectation for closed dialog
   */
  dialogClosed: (dialogType: string, moveIndex?: number): Expectation => ({
    type: "dialog",
    moveIndex,
    data: { dialogType, dialogOpen: false },
  }),
};
