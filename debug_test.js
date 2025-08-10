// Debugging the exact test case
console.log('=== Debugging MoveQualityEvaluator Test Case ===');

// Simulate the exact test scenario
const wdlBefore = 0;    // Draw from Black's perspective (before move)
const wdlAfter = 1000;  // Win from White's perspective (after move)
const trainingBaseline = undefined; // No baseline passed in test

console.log(`Input values:`);
console.log(`  wdlBefore: ${wdlBefore}`);
console.log(`  wdlAfter: ${wdlAfter}`);
console.log(`  trainingBaseline: ${trainingBaseline}`);

// Step 1: Convert to player perspective
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

const { wdlBeforeFromPlayerPerspective, wdlAfterFromPlayerPerspective } =
  WdlAdapter.convertToPlayerPerspective(wdlBefore, wdlAfter);

console.log(`\nAfter convertToPlayerPerspective:`);
console.log(`  wdlBeforeFromPlayerPerspective: ${wdlBeforeFromPlayerPerspective}`);
console.log(`  wdlAfterFromPlayerPerspective: ${wdlAfterFromPlayerPerspective}`);

// Step 2: Determine effective baseline
const effectiveWdlBefore = trainingBaseline?.wdl ?? wdlBeforeFromPlayerPerspective;
console.log(`\nEffective baseline:`);
console.log(`  effectiveWdlBefore: ${effectiveWdlBefore}`);

// Step 3: Check outcome change  
const outcomeChanged = WdlAdapter.didOutcomeChange(
  effectiveWdlBefore,
  wdlAfterFromPlayerPerspective
);

console.log(`\nOutcome change detection:`);
console.log(`  WdlAdapter.didOutcomeChange(${effectiveWdlBefore}, ${wdlAfterFromPlayerPerspective}): ${outcomeChanged}`);
console.log(`  Expected: true`);

// Check individual conditions
console.log(`\nBreaking down didOutcomeChange:`);
const isWinToDrawOrLoss = WdlAdapter.isWinToDrawOrLoss(effectiveWdlBefore, wdlAfterFromPlayerPerspective);
const isDrawToLoss = WdlAdapter.isDrawToLoss(effectiveWdlBefore, wdlAfterFromPlayerPerspective);
console.log(`  isWinToDrawOrLoss(${effectiveWdlBefore}, ${wdlAfterFromPlayerPerspective}): ${isWinToDrawOrLoss}`);
console.log(`  isDrawToLoss(${effectiveWdlBefore}, ${wdlAfterFromPlayerPerspective}): ${isDrawToLoss}`);
console.log(`  Overall result: ${isWinToDrawOrLoss || isDrawToLoss}`);

// Step 4: wasMoveBest simulation
const playedMove = "Kd6";
const bestMoves = ["Ke7"];
const wasMoveBest = bestMoves.includes(playedMove);
console.log(`\nMove optimality check:`);
console.log(`  playedMove: "${playedMove}"`);
console.log(`  bestMoves: ${JSON.stringify(bestMoves)}`);
console.log(`  wasMoveBest: ${wasMoveBest}`);

// Final result
const shouldShowErrorDialog = !wasMoveBest && outcomeChanged;
console.log(`\nFinal result:`);
console.log(`  wasOptimal: ${wasMoveBest}`);
console.log(`  outcomeChanged: ${outcomeChanged}`);
console.log(`  shouldShowErrorDialog: ${shouldShowErrorDialog}`);