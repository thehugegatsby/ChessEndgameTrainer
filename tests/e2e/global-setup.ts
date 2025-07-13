/**
 * Global E2E Test Setup - Clean Architecture
 * Expert validated aggressive implementation
 */

import { chromium, FullConfig } from '@playwright/test';

// Configuration constants
const SERVER_CHECK_RETRIES = 30;
const SERVER_CHECK_INTERVAL_MS = 1000;
const SERVER_CHECK_TIMEOUT_MS = 5000;
const ENGINE_CHECK_TIMEOUT_MS = 3000;

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E Global Setup - Clean Architecture');
  
  // Browser setup for shared context
  const browser = await chromium.launch();
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Wait for dev server to be ready
    const baseURL = config.projects[0].use?.baseURL || 'http://127.0.0.1:3002';
    console.log(`📡 Checking dev server readiness at ${baseURL}`);
    
    let retries = SERVER_CHECK_RETRIES;
    while (retries > 0) {
      try {
        await page.goto(baseURL, { timeout: SERVER_CHECK_TIMEOUT_MS });
        console.log('✅ Dev server is ready');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`Dev server not ready after ${SERVER_CHECK_RETRIES} attempts: ${error}`);
        }
        await new Promise(resolve => setTimeout(resolve, SERVER_CHECK_INTERVAL_MS));
      }
    }
    
    // Verify engine is loadable (comprehensive check)
    try {
      await page.evaluate((timeoutMs) => {
        return new Promise((resolve, reject) => {
          if (typeof Worker === 'undefined') {
            return reject(new Error('Worker API not available'));
          }
          
          // Try to load the actual stockfish worker
          let worker: Worker | undefined;
          const timeout = setTimeout(() => {
            worker?.terminate();
            reject(new Error(`Engine worker failed to initialize within ${timeoutMs}ms`));
          }, timeoutMs);
          
          try {
            // Attempt to create worker with stockfish path
            worker = new Worker('/stockfish.wasm.js');
            
            worker.onmessage = (event) => {
              clearTimeout(timeout);
              worker?.terminate();
              resolve('Engine worker loaded successfully');
            };
            
            worker.onerror = (err) => {
              clearTimeout(timeout);
              reject(new Error(`Engine worker error: ${err.message || 'Unknown error'}`));
            };
            
            // Send initial command to test worker response
            worker.postMessage('uci');
          } catch (err) {
            clearTimeout(timeout);
            reject(new Error(`Failed to create engine worker: ${err instanceof Error ? err.message : 'Unknown error'}`));
          }
        });
      }, ENGINE_CHECK_TIMEOUT_MS);
      console.log('✅ Engine worker verified (comprehensive check)');
    } catch (error) {
      console.warn('⚠️ Engine worker check failed (continuing anyway):', error);
    }
    
    await context.close();
  } finally {
    await browser.close();
  }
  
  console.log('🎯 E2E Global Setup Complete - Ready for aggressive testing!');
}

export default globalSetup;