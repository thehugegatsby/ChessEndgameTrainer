/**
 * MSW Handlers for Lichess Tablebase API - E2E Test Mocking
 * 
 * Provides deterministic responses for E2E tests, eliminating network dependencies
 * and enabling error scenario testing.
 * 
 * @example
 * ```typescript
 * // Setup in test
 * await setupMSW(page, tablebaseHandlers.success);
 * 
 * // Make moves - get predictable responses
 * await chessboard.makeMove("e2", "e4");
 * await chessboard.assertEvaluationAvailable();
 * ```
 */

import { http, HttpResponse } from 'msw';
import { getLogger } from '@shared/services/logging';

const logger = getLogger().setContext('E2E-TablebaseMock');

// Standard endgame positions for testing
const MOCK_POSITIONS = {
  // King + Pawn vs King - winning for white
  KPK_WIN: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
  // After e6 move - still winning
  KPK_WIN_E6: "4k3/8/4KP2/8/8/8/8/8 b - - 0 1", 
  // After promotion - mate
  KPK_MATE: "4Q3/8/4K3/8/8/8/8/4k3 b - - 0 1"
};

const MOCK_RESPONSES = {
  // Winning position - DTM 12
  KPK_WIN_ANALYSIS: {
    dtz: 12,
    precise_dtz: 12,
    dtm: 12,
    checkmate: false,
    stalemate: false,
    variant_win: true,
    variant_loss: false,
    insufficient_material: false,
    category: "win" as const,
    moves: [
      {
        uci: "e5e6",
        san: "e6",
        dtz: -11,
        precise_dtz: -11,
        dtm: -11,
        zeroing: false,
        checkmate: false,
        stalemate: false,
        variant_win: false,
        variant_loss: true,
        insufficient_material: false,
        category: "loss" as const
      },
      {
        uci: "e6d6", 
        san: "Kd6",
        dtz: -12,
        precise_dtz: -12,
        dtm: -12,
        zeroing: false,
        checkmate: false,
        stalemate: false,
        variant_win: false,
        variant_loss: true,
        insufficient_material: false,
        category: "loss" as const
      }
    ]
  },

  // After e6 - Black to move, losing
  KPK_E6_ANALYSIS: {
    dtz: -11,
    precise_dtz: -11,
    dtm: -11,
    checkmate: false,
    stalemate: false,
    variant_win: false,
    variant_loss: true,
    insufficient_material: false,
    category: "loss" as const,
    moves: [
      {
        uci: "e8f8",
        san: "Kf8", 
        dtz: 10,
        precise_dtz: 10,
        dtm: 10,
        zeroing: false,
        checkmate: false,
        stalemate: false,
        variant_win: true,
        variant_loss: false,
        insufficient_material: false,
        category: "win" as const
      }
    ]
  },

  // Mate position
  KPK_MATE_ANALYSIS: {
    dtz: 0,
    precise_dtz: 0, 
    dtm: 0,
    checkmate: true,
    stalemate: false,
    variant_win: false,
    variant_loss: true,
    insufficient_material: false,
    category: "loss" as const,
    moves: []
  }
};

/**
 * Success handlers - return winning positions and moves
 */
export const successHandlers = [
  // Handle tablebase standard endpoint
  http.get('https://tablebase.lichess.ovh/standard', ({ request }) => {
    const url = new URL(request.url);
    const fen = url.searchParams.get('fen');
    
    logger.debug('🎯 Mocking tablebase request', { fen });

    // Route based on FEN position
    if (fen?.includes(MOCK_POSITIONS.KPK_WIN)) {
      logger.info('✅ Returning KPK winning analysis');
      return HttpResponse.json(MOCK_RESPONSES.KPK_WIN_ANALYSIS);
    }
    
    if (fen?.includes('4KP2')) { // After e6
      logger.info('✅ Returning KPK e6 analysis');
      return HttpResponse.json(MOCK_RESPONSES.KPK_E6_ANALYSIS);
    }
    
    if (fen?.includes('4Q3')) { // Mate position
      logger.info('✅ Returning KPK mate analysis');
      return HttpResponse.json(MOCK_RESPONSES.KPK_MATE_ANALYSIS);
    }

    // Default winning response for unknown positions
    logger.info('✅ Returning default winning analysis');
    return HttpResponse.json({
      dtz: 5,
      precise_dtz: 5,
      dtm: 5,
      checkmate: false,
      stalemate: false,
      variant_win: true,
      variant_loss: false,
      insufficient_material: false,
      category: "win" as const,
      moves: [
        {
          uci: "e2e4",
          san: "e4",
          dtz: -4,
          precise_dtz: -4,
          dtm: -4,
          zeroing: false,
          checkmate: false,
          stalemate: false,
          variant_win: false,
          variant_loss: true,
          insufficient_material: false,
          category: "loss" as const
        }
      ]
    });
  })
];

/**
 * Error handlers - simulate API failures for error testing
 */
export const errorHandlers = [
  // Network error
  http.get('https://tablebase.lichess.ovh/standard', () => {
    logger.info('❌ Simulating tablebase network error');
    return HttpResponse.error();
  })
];

/**
 * Slow response handlers - test loading states
 */
export const slowHandlers = [
  http.get('https://tablebase.lichess.ovh/standard', async () => {
    logger.info('🐌 Simulating slow tablebase response (3s)');
    await new Promise(resolve => setTimeout(resolve, 3000));
    return HttpResponse.json(MOCK_RESPONSES.KPK_WIN_ANALYSIS);
  })
];

/**
 * Draw position handlers - positions that should not trigger win
 */
export const drawHandlers = [
  http.get('https://tablebase.lichess.ovh/standard', () => {
    logger.info('🤝 Returning draw analysis');
    return HttpResponse.json({
      dtz: 0,
      precise_dtz: 0,
      dtm: 0,
      checkmate: false,
      stalemate: false,
      variant_win: false,
      variant_loss: false,
      insufficient_material: true,
      category: "draw" as const,
      moves: []
    });
  })
];

/**
 * Comprehensive handler collections for different test scenarios
 */
export const tablebaseHandlers = {
  success: successHandlers,
  error: errorHandlers,
  slow: slowHandlers,
  draw: drawHandlers
};