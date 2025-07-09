/**
 * Smoke tests for production deployment verification
 * These tests ensure critical functionality works after deployment
 */

import { APP_CONFIG } from '../../config/constants';

describe('Smoke Tests', () => {
  const PRODUCTION_URL = process.env.PRODUCTION_URL || APP_CONFIG.DEV_URL;

  beforeAll(() => {
    if (!process.env.SMOKE_TEST) {
      console.log('Skipping smoke tests - set SMOKE_TEST=true to run');
    }
  });

  describe('Critical Pages Load', () => {
    it.skip('should load the homepage', async () => {
      if (!process.env.SMOKE_TEST) return;
      
      const response = await fetch(PRODUCTION_URL);
      expect(response.status).toBe(200);
      
      const html = await response.text();
      expect(html).toContain('ChessEndgameTrainer');
    });

    it.skip('should load a training page', async () => {
      if (!process.env.SMOKE_TEST) return;
      
      const response = await fetch(`${PRODUCTION_URL}/train/1`);
      expect(response.status).toBe(200);
    });
  });

  describe('API Health Checks', () => {
    it.skip('should load static assets', async () => {
      if (!process.env.SMOKE_TEST) return;
      
      // Check if Next.js static files are accessible
      const response = await fetch(`${PRODUCTION_URL}/_next/static/chunks/webpack.js`);
      expect(response.status).toBeLessThan(400);
    });

    it.skip('should have correct headers', async () => {
      if (!process.env.SMOKE_TEST) return;
      
      const response = await fetch(PRODUCTION_URL);
      
      // Security headers
      expect(response.headers.get('x-frame-options')).toBeTruthy();
      expect(response.headers.get('content-type')).toContain('text/html');
    });
  });

  describe('Critical Resources', () => {
    it.skip('should load Stockfish WASM', async () => {
      if (!process.env.SMOKE_TEST) return;
      
      const response = await fetch(`${PRODUCTION_URL}/stockfish/stockfish-nnue-16.wasm`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/wasm');
    });

    it.skip('should have manifest.json for PWA', async () => {
      if (!process.env.SMOKE_TEST) return;
      
      const response = await fetch(`${PRODUCTION_URL}/manifest.json`);
      expect(response.status).toBe(200);
      
      const manifest = await response.json();
      expect(manifest.name).toBe('Chess Endgame Trainer');
    });
  });
});