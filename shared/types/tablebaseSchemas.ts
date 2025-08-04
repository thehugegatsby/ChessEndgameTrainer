/**
 * Zod schemas for Lichess Tablebase API responses
 *
 * @remarks
 * These schemas validate the shape of API responses to ensure
 * data integrity at service boundaries. They provide type safety
 * and clear documentation of the expected API contract.
 */

import { z } from "zod";

/**
 * Schema for individual moves in tablebase response
 */
export const TablebaseMoveSchema = z.object({
  uci: z.string(),
  san: z.string(),
  category: z.string(),
  dtz: z.number().nullable(),
  dtm: z.number().nullable(),
  zeroing: z.boolean().optional().default(false),
  checkmate: z.boolean().optional().default(false),
  stalemate: z.boolean().optional().default(false),
  variant_win: z.boolean().optional().default(false),
  variant_loss: z.boolean().optional().default(false),
  insufficient_material: z.boolean().optional().default(false),
});

/**
 * Schema for main tablebase API response
 */
export const LichessTablebaseResponseSchema = z.object({
  category: z.string(), // Required - every position has a category
  dtz: z.number().nullable(), // Required but can be null
  dtm: z.number().nullable(), // Required but can be null
  precise_dtz: z.number().nullable().optional(),
  checkmate: z.boolean().optional().default(false),
  stalemate: z.boolean().optional().default(false),
  variant_win: z.boolean().optional().default(false),
  variant_loss: z.boolean().optional().default(false),
  insufficient_material: z.boolean().optional().default(false),
  moves: z.array(TablebaseMoveSchema).optional().default([]),
});

/**
 * Type inference from schema
 */
export type ValidatedTablebaseResponse = z.infer<
  typeof LichessTablebaseResponseSchema
>;
export type ValidatedTablebaseMove = z.infer<typeof TablebaseMoveSchema>;
