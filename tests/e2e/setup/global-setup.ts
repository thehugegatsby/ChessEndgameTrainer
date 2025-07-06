import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🌐 Starting E2E global setup...');
  
  // Launch browser to warm up the application
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the application and wait for it to be ready
    await page.goto('http://localhost:3000');
    
    // Wait for the main application to load
    await page.waitForSelector('[data-testid="chessboard"], .chessboard, #root', { 
      timeout: 30000 
    });
    
    console.log('✅ Application is ready for E2E testing');
    
    // Optionally set up test data or authentication state here
    
  } catch (error) {
    console.error('❌ E2E setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('🎯 E2E global setup complete');
}

export default globalSetup;