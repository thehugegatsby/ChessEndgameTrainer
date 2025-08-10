// Debug script to test WDL conversion logic
console.log('=== WDL Adapter Logic Debug ===');

// Simulate the WdlAdapter methods
const WdlAdapter = {
  flipPerspective: (wdl) => -wdl,
  
  convertToPlayerPerspective: (wdlBefore, wdlAfter) => ({
    wdlBeforeFromPlayerPerspective: wdlBefore,
    wdlAfterFromPlayerPerspective: WdlAdapter.flipPerspective(wdlAfter)
  }),
  
  isDrawToLoss: (wdlBefore, wdlAfter) => wdlBefore === 0 && wdlAfter < 0,
  
  isWinToDrawOrLoss: (wdlBefore, wdlAfter) => wdlBefore > 0 && wdlAfter <= 0,
  
  didOutcomeChange: (wdlBefore, wdlAfter) => 
    WdlAdapter.isWinToDrawOrLoss(wdlBefore, wdlAfter) || 
    WdlAdapter.isDrawToLoss(wdlBefore, wdlAfter)
};

// Test case from failing test: Black move "Draw → Loss"
console.log('\n--- Test Case: Black Draw→Loss ---');
const wdlBefore = 0;    // Draw from Black's perspective
const wdlAfter = 1000;  // Win from White's perspective

console.log(`wdlBefore: ${wdlBefore} (Black's Draw)`);
console.log(`wdlAfter: ${wdlAfter} (White's Win)`);

const converted = WdlAdapter.convertToPlayerPerspective(wdlBefore, wdlAfter);
console.log(`After conversion:`);
console.log(`  wdlBeforeFromPlayerPerspective: ${converted.wdlBeforeFromPlayerPerspective}`);
console.log(`  wdlAfterFromPlayerPerspective: ${converted.wdlAfterFromPlayerPerspective}`);

const isDrawToLoss = WdlAdapter.isDrawToLoss(
  converted.wdlBeforeFromPlayerPerspective, 
  converted.wdlAfterFromPlayerPerspective
);
console.log(`isDrawToLoss(${converted.wdlBeforeFromPlayerPerspective}, ${converted.wdlAfterFromPlayerPerspective}): ${isDrawToLoss}`);

const didOutcomeChange = WdlAdapter.didOutcomeChange(
  converted.wdlBeforeFromPlayerPerspective,
  converted.wdlAfterFromPlayerPerspective
);
console.log(`didOutcomeChange: ${didOutcomeChange}`);
console.log(`Expected: true`);

// Test another case
console.log('\n--- Test Case: White Win→Draw ---');
const wdlBefore2 = 500;  // Win from White's perspective  
const wdlAfter2 = 0;     // Draw from Black's perspective

console.log(`wdlBefore: ${wdlBefore2} (White's Win)`);
console.log(`wdlAfter: ${wdlAfter2} (Black's Draw)`);

const converted2 = WdlAdapter.convertToPlayerPerspective(wdlBefore2, wdlAfter2);
console.log(`After conversion:`);
console.log(`  wdlBeforeFromPlayerPerspective: ${converted2.wdlBeforeFromPlayerPerspective}`);
console.log(`  wdlAfterFromPlayerPerspective: ${converted2.wdlAfterFromPlayerPerspective}`);

const isWinToDrawOrLoss = WdlAdapter.isWinToDrawOrLoss(
  converted2.wdlBeforeFromPlayerPerspective,
  converted2.wdlAfterFromPlayerPerspective
);
console.log(`isWinToDrawOrLoss(${converted2.wdlBeforeFromPlayerPerspective}, ${converted2.wdlAfterFromPlayerPerspective}): ${isWinToDrawOrLoss}`);

const didOutcomeChange2 = WdlAdapter.didOutcomeChange(
  converted2.wdlBeforeFromPlayerPerspective,
  converted2.wdlAfterFromPlayerPerspective
);
console.log(`didOutcomeChange: ${didOutcomeChange2}`);
console.log(`Expected: true`);