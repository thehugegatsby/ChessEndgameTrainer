const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function testSqlJs() {
  console.log('=== SQL.JS POC TEST ===');
  
  const startTime = performance.now();
  let results = {
    library: 'sql.js',
    success: false,
    initTime: 0,
    insertTime: 0,
    queryTime: 0,
    bundleSize: 0,
    memoryUsage: 0,
    errors: []
  };

  try {
    // 1. Initialization Test
    console.log('1. Initializing SQL.js...');
    const initStart = performance.now();
    
    const SQL = await initSqlJs({
      locateFile: (file) => {
        return path.join(__dirname, 'node_modules/sql.js/dist', file);
      }
    });
    
    const db = new SQL.Database();
    const initEnd = performance.now();
    results.initTime = initEnd - initStart;
    console.log(`   Initialization: ${results.initTime.toFixed(2)}ms`);

    // 2. Schema Creation
    console.log('2. Creating schema...');
    const schema = `
      CREATE TABLE positions (
        id TEXT PRIMARY KEY,
        fen TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 10),
        solution_moves TEXT,
        tags TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      
      CREATE TABLE user_progress (
        position_id TEXT PRIMARY KEY,
        attempts INTEGER DEFAULT 0,
        solved BOOLEAN DEFAULT FALSE,
        best_time INTEGER,
        notes TEXT,
        FOREIGN KEY (position_id) REFERENCES positions(id)
      );
      
      CREATE INDEX idx_positions_category ON positions(category);
      CREATE INDEX idx_positions_difficulty ON positions(difficulty);
    `;
    
    db.exec(schema);
    console.log('   Schema created successfully');

    // 3. Insert Performance Test
    console.log('3. Testing insert performance...');
    const insertStart = performance.now();
    
    const insertStmt = db.prepare(`
      INSERT INTO positions (id, fen, category, difficulty, solution_moves, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    // Generate test data
    const testPositions = [];
    for (let i = 0; i < 1000; i++) {
      testPositions.push([
        `pos-${i}`,
        `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 ${i}`,
        i % 2 === 0 ? 'rook_endgame' : 'queen_endgame',
        (i % 10) + 1,
        JSON.stringify(['e4', 'e5', 'Nf3']),
        JSON.stringify(['basic', 'tactical'])
      ]);
    }
    
    // Batch insert
    for (const position of testPositions) {
      insertStmt.run(position);
    }
    
    insertStmt.free();
    const insertEnd = performance.now();
    results.insertTime = insertEnd - insertStart;
    console.log(`   Insert 1000 records: ${results.insertTime.toFixed(2)}ms`);

    // 4. Query Performance Test
    console.log('4. Testing query performance...');
    const queryStart = performance.now();
    
    // Test various query patterns
    const queries = [
      "SELECT COUNT(*) FROM positions",
      "SELECT * FROM positions WHERE category = 'rook_endgame' LIMIT 10",
      "SELECT * FROM positions WHERE difficulty > 5 ORDER BY difficulty",
      "SELECT category, COUNT(*) FROM positions GROUP BY category"
    ];
    
    for (const query of queries) {
      const result = db.exec(query);
      console.log(`   Query: ${query.substring(0, 50)}... -> ${result.length} result sets`);
    }
    
    const queryEnd = performance.now();
    results.queryTime = queryEnd - queryStart;
    console.log(`   Query performance: ${results.queryTime.toFixed(2)}ms`);

    // 5. Memory Usage Test
    const memUsed = process.memoryUsage();
    results.memoryUsage = Math.round(memUsed.heapUsed / 1024 / 1024);
    console.log(`   Memory usage: ${results.memoryUsage}MB`);

    // 6. Persistence Test
    console.log('5. Testing persistence...');
    const data = db.export();
    results.bundleSize = data.length;
    console.log(`   Database size: ${(results.bundleSize / 1024).toFixed(2)}KB`);
    
    // Save to file
    fs.writeFileSync(path.join(__dirname, 'test-database-sqljs.db'), data);
    console.log('   Database saved to disk');

    // 7. Reload Test
    const reloadedDb = new SQL.Database(data);
    const countResult = reloadedDb.exec("SELECT COUNT(*) FROM positions");
    const count = countResult[0].values[0][0];
    console.log(`   Reloaded database contains ${count} positions`);
    
    reloadedDb.close();
    db.close();
    
    results.success = true;
    console.log('✅ SQL.js test completed successfully');
    
  } catch (error) {
    console.error('❌ SQL.js test failed:', error);
    results.errors.push(error.message);
  }

  const totalTime = performance.now() - startTime;
  console.log(`\n📊 SQL.js Results:`);
  console.log(`   Success: ${results.success}`);
  console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`   Init time: ${results.initTime.toFixed(2)}ms`);
  console.log(`   Insert time: ${results.insertTime.toFixed(2)}ms`);
  console.log(`   Query time: ${results.queryTime.toFixed(2)}ms`);
  console.log(`   Memory usage: ${results.memoryUsage}MB`);
  console.log(`   DB size: ${(results.bundleSize / 1024).toFixed(2)}KB`);
  
  // Save results
  fs.writeFileSync(
    path.join(__dirname, 'results-sqljs.json'),
    JSON.stringify(results, null, 2)
  );
  
  return results;
}

if (require.main === module) {
  testSqlJs().catch(console.error);
}

module.exports = testSqlJs;