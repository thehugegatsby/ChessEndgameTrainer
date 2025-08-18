import { test, expect } from '@playwright/test';

test('Debug Navigation Console Logs', async ({ page }) => {
  // Capture all console logs
  const logs: string[] = [];
  
  page.on('console', (msg) => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    logs.push(text);
    console.log(text); // Output to test runner console
  });

  // Navigate to training page
  await page.goto('http://localhost:3002/train/1');
  await page.waitForSelector('[data-testid="training-board"]');
  
  console.log('\n🔍 === INITIAL LOGS ===');
  logs.forEach(log => console.log(log));
  logs.length = 0; // Clear logs
  
  // Make a move (click method)
  console.log('\n📍 Making move e6 → d6...');
  
  // Get the piece and destination
  const fromSquare = page.locator('[data-square="e6"]');
  const toSquare = page.locator('[data-square="d6"]');
  
  await fromSquare.click();
  await toSquare.click();
  
  // Wait a bit for logs to come in
  await page.waitForTimeout(2000);
  
  console.log('\n🔍 === LOGS AFTER MOVE ===');
  logs.forEach(log => console.log(log));
  logs.length = 0; // Clear logs
  
  // Click navigation button
  console.log('\n📍 Clicking navigation button...');
  const nextButton = page.locator('button[title="Nächste Stellung"]');
  await nextButton.click();
  
  // Wait for potential navigation
  await page.waitForTimeout(1000);
  
  console.log('\n🔍 === LOGS AFTER BUTTON CLICK ===');
  logs.forEach(log => console.log(log));
  
  // Check final URL
  const finalUrl = page.url();
  console.log(`\n🎯 Final URL: ${finalUrl}`);
  console.log(`Expected: /train/2, Got: ${finalUrl.includes('/train/2') ? '✅ SUCCESS' : '❌ FAILED'}`);
});