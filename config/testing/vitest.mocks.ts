/**
 * Global Mock Resolution for Vitest
 * Handles mock resolution for modules that Vitest can't find automatically
 */

import { vi } from 'vitest';
import path from 'path';

// Manual mock resolution for modules with __mocks__ directories
export function setupGlobalMocks() {
  // ChessService Mock
  vi.mock('@shared/services/ChessService', async () => {
    const mockPath = path.resolve(__dirname, '../../src/shared/services/__mocks__/ChessService.ts');
    return await import(mockPath);
  });

  // TablebaseService Mock  
  vi.mock('@shared/services/TablebaseService', async () => {
    const mockPath = path.resolve(__dirname, '../../src/shared/services/__mocks__/TablebaseService.ts');
    return await import(mockPath);
  });
}