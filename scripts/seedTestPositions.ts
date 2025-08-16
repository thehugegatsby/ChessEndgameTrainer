/**
 * Script to seed test positions in Firestore emulator
 * Creates positions 12, 13, 14 for testing the rename script
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc } from 'firebase/firestore';

const testPositions = [
  {
    id: 12,
    title: 'Test Position 12',
    fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
    solution: ['e2e4', 'e8e7', 'e1e2'],
    targetMoves: 3,
    description: 'Test position 12 for renaming',
    hints: ['Think about advancing the pawn'],
    difficulty: 'beginner' as const,
    category: 'basic-checkmates',
    sideToMove: 'white' as const,
    goal: 'win' as const,
  },
  {
    id: 13,
    title: 'Test Position 13',
    fen: '8/8/8/8/8/3k4/8/R3K3 w - - 0 1',
    solution: ['Ra3+', 'Kd2', 'Ra2+'],
    targetMoves: 3,
    description: 'Test position 13 for renaming',
    hints: ['Cut off the king'],
    difficulty: 'intermediate' as const,
    category: 'rook-endgames',
    sideToMove: 'white' as const,
    goal: 'win' as const,
  },
  {
    id: 14,
    title: 'Test Position 14',
    fen: '8/p7/8/8/8/8/P7/8 w - - 0 1',
    solution: ['a4', 'a5', 'a5'],
    targetMoves: 5,
    description: 'Test position 14 for renaming',
    hints: ['Opposition is key'],
    difficulty: 'advanced' as const,
    category: 'pawn-endgames',
    sideToMove: 'white' as const,
    goal: 'win' as const,
  },
];

async function seedTestPositions() {
  console.log('🌱 Seeding test positions...');

  try {
    // Initialize Firebase
    const app = initializeApp({
      projectId: 'test-project',
      apiKey: 'test-key',
      authDomain: 'test.firebaseapp.com',
    });

    const db = getFirestore(app);

    // Connect to emulator
    console.log('📡 Connecting to Firestore emulator...');
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
      console.log('📡 Emulator already connected or not available');
    }

    // Create test positions
    for (const position of testPositions) {
      console.log(`🌱 Creating position ${position.id}: "${position.title}"`);
      const docRef = doc(db, 'positions', position.id.toString());
      await setDoc(docRef, position);
      console.log(`✅ Created position ${position.id}`);
    }

    console.log('🎉 Test positions seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding test positions:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  seedTestPositions()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedTestPositions };
