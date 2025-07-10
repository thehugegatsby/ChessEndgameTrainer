import { test, expect } from '@playwright/test';

test('Debug environment variable', async ({ page }) => {
  // Capture all console messages
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Navigate to the app
  await page.goto('http://127.0.0.1:3002/train/1');
  
  // Wait a bit for app to initialize
  await page.waitForTimeout(2000);
  
  // Check if NEXT_PUBLIC_IS_E2E_TEST is set in the browser
  const envValue = await page.evaluate(() => {
    return (window as any).process?.env?.NEXT_PUBLIC_IS_E2E_TEST || 
           (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_IS_E2E_TEST);
  });
  
  console.log('Environment variable in browser:', envValue);
  console.log('Console logs captured:', consoleLogs);
  
  // Check if e2e_makeMove is available
  const hasE2EMakeMove = await page.evaluate(() => {
    return typeof (window as any).e2e_makeMove === 'function';
  });
  
  console.log('Has e2e_makeMove:', hasE2EMakeMove);
  
  // Get all window properties starting with e2e_
  const e2eProperties = await page.evaluate(() => {
    return Object.keys(window).filter(key => key.startsWith('e2e_'));
  });
  
  console.log('E2E properties on window:', e2eProperties);
  
  expect(envValue).toBe('true');
  expect(hasE2EMakeMove).toBe(true);
});