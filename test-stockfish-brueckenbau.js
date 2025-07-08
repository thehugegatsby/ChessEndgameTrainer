// Test Stockfish with the Brückenbau position
// This script uses the Stockfish CLI directly

const { spawn } = require('child_process');
const path = require('path');

async function testStockfishWithPosition() {
  console.log('=== Testing Stockfish with Brückenbau Position ===\n');

  const positionAfterKd7 = '8/2PK1k2/8/8/4R3/8/1r6/8 b - - 1 1';
  console.log('Testing position:', positionAfterKd7);

  // Try to find stockfish executable
  const stockfishPaths = [
    'stockfish',  // System PATH
    '/usr/games/stockfish',  // Common Linux location
    '/usr/local/bin/stockfish',  // macOS homebrew
    path.join(__dirname, 'node_modules', 'stockfish', 'src', 'stockfish'),  // npm package
  ];

  let stockfish = null;
  let stockfishPath = null;

  // Try each path
  for (const pathToTry of stockfishPaths) {
    try {
      stockfish = spawn(pathToTry);
      stockfishPath = pathToTry;
      stockfish.kill();
      break;
    } catch (e) {
      // Continue to next path
    }
  }

  if (!stockfishPath) {
    console.error('Could not find Stockfish executable. Please install Stockfish:');
    console.error('- Ubuntu/Debian: sudo apt-get install stockfish');
    console.error('- macOS: brew install stockfish');
    console.error('- Or download from: https://stockfishchess.org/download/');
    return;
  }

  console.log('Found Stockfish at:', stockfishPath);
  console.log();

  // Start Stockfish
  stockfish = spawn(stockfishPath);

  return new Promise((resolve) => {
    let output = '';
    let bestMove = null;
    let evaluation = null;

    stockfish.stdout.on('data', (data) => {
      const str = data.toString();
      output += str;
      
      // Parse evaluation info
      if (str.includes('info depth')) {
        const scoreMatch = str.match(/score (cp|mate) (-?\d+)/);
        if (scoreMatch) {
          if (scoreMatch[1] === 'cp') {
            evaluation = parseInt(scoreMatch[2]) / 100;  // Convert centipawns to pawns
          } else {
            evaluation = scoreMatch[2] > 0 ? `Mate in ${scoreMatch[2]}` : `-Mate in ${Math.abs(scoreMatch[2])}`;
          }
        }
      }

      // Parse best move
      if (str.includes('bestmove')) {
        const moveMatch = str.match(/bestmove (\w+)/);
        if (moveMatch) {
          bestMove = moveMatch[1];
        }
      }
    });

    stockfish.stderr.on('data', (data) => {
      console.error('Stockfish error:', data.toString());
    });

    // Send commands to Stockfish
    stockfish.stdin.write('uci\n');
    stockfish.stdin.write('isready\n');
    
    setTimeout(() => {
      console.log('Setting up position...');
      stockfish.stdin.write(`position fen ${positionAfterKd7}\n`);
      stockfish.stdin.write('d\n');  // Display position
      
      setTimeout(() => {
        console.log('\nAnalyzing position (depth 20)...');
        stockfish.stdin.write('go depth 20\n');
        
        setTimeout(() => {
          stockfish.stdin.write('quit\n');
          
          console.log('\n=== Results ===');
          console.log('Best move for Black:', bestMove);
          console.log('Evaluation:', evaluation);
          
          // Convert UCI move to SAN
          if (bestMove) {
            const from = bestMove.substring(0, 2);
            const to = bestMove.substring(2, 4);
            console.log(`Move: ${from} to ${to}`);
            
            // Check if it's a check
            if (bestMove === 'b2b1' || bestMove === 'd2d1') {
              console.log('This is a checking move!');
            }
          }
          
          console.log('\nRaw Stockfish output (last 1000 chars):');
          console.log(output.slice(-1000));
          
          resolve();
        }, 3000);  // Wait 3 seconds for analysis
      }, 1000);  // Wait 1 second after position setup
    }, 1000);  // Wait 1 second after UCI setup
  });
}

// Run the test
testStockfishWithPosition().catch(console.error);