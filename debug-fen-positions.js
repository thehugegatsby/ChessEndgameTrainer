// Debug script to show FEN positions in MockScenarioEngine

console.log("=== FEN POSITIONS IN MOCKSCENARIOENGINE ===");

console.log("\n1. Standard starting position:");
console.log("FEN: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
console.log("Move: e2-e4");

console.log("\n2. After 1.e4:");
console.log("FEN: rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");  
console.log("Move: e7-e5");

console.log("\n3. After 1.e4 e5:");
console.log("FEN: rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2");
console.log("Move: g1-f3 (Nf3)");

console.log("\n4. Opposition training position 1 (Position ID 1):");
console.log("FEN: 4k3/8/4K3/4P3/8/8/8/8 w - - 0 1");
console.log("Move: e6-d6 (Kd6)");

console.log("\n5. After Kd6:");
console.log("FEN: 4k3/8/3K4/4P3/8/8/8/8 b - - 1 1");
console.log("Move: e8-d8 (Kd8)");

console.log("\n=== PROBLEM ANALYSIS ===");
console.log("Test navigates to Position 1 which is the Opposition training position.");
console.log("In this position, there is NO e2 square or e4 square available!");
console.log("The test tries to make e2-e4 move but this is impossible in a King + Pawn endgame.");
console.log("We need to either:");
console.log("1. Change the test to use a valid move for the position");
console.log("2. Change Position 1 to be the standard starting position");
console.log("3. Navigate to a different position that allows e2-e4");