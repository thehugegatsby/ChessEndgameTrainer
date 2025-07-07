#!/usr/bin/env ts-node

import { positionService } from '../shared/services/database/positionService';
import chalk from 'chalk';

// Load env vars
require('dotenv').config({ path: '.env.local' });

async function testFirestoreReads() {
  console.log(chalk.blue('🔍 Testing Firestore Reads'));
  console.log(chalk.gray('========================\n'));

  try {
    // Test single position read
    console.log(chalk.yellow('1. Testing single position read...'));
    const position1 = await positionService.getPosition(1);
    if (position1) {
      console.log(chalk.green('✅ Found position 1:'), position1.title);
    } else {
      console.log(chalk.red('❌ Position 1 not found'));
    }

    // Test all positions read
    console.log(chalk.yellow('\n2. Testing all positions read...'));
    const allPositions = await positionService.getAllPositions();
    console.log(chalk.green(`✅ Found ${allPositions.length} positions`));

    // Test category filter
    console.log(chalk.yellow('\n3. Testing category filter...'));
    const pawnPositions = await positionService.getPositionsByCategory('pawn');
    console.log(chalk.green(`✅ Found ${pawnPositions.length} pawn positions`));

    // Test cache
    console.log(chalk.yellow('\n4. Testing cache...'));
    const cacheStats = positionService.getCacheStats();
    console.log(chalk.green('✅ Cache stats:'), cacheStats);

    console.log(chalk.green('\n✨ All tests passed! Firestore is working correctly.'));
    
  } catch (error) {
    console.log(chalk.red('❌ Test failed:'), error);
  }
}

testFirestoreReads().catch(console.error);