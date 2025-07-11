/**
 * Lightweight Test API Server
 * Alternative to Cloud Functions for E2E test support
 */

import express from 'express';
import cors from 'cors';
import { testAdmin } from './firebase-admin-helpers';
import { EndgamePosition } from '@shared/types/endgame';

export class TestApiServer {
  private app: express.Application;
  private server: any;
  private port: number;

  constructor(port = 3003) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Only allow in test environment
    this.app.use((req, res, next) => {
      if (process.env.NODE_ENV !== 'test' && process.env.NEXT_PUBLIC_IS_E2E_TEST !== 'true') {
        return res.status(403).json({ error: 'Test API only available in test environment' });
      }
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', environment: 'test' });
    });

    // Firebase test data management endpoints
    this.app.post('/e2e/firebase/setup', async (req, res) => {
      try {
        // Admin SDK is already initialized in start()
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.app.post('/e2e/firebase/clear', async (req, res) => {
      try {
        await testAdmin.clearAllData();
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.app.post('/e2e/firebase/seed-positions', async (req, res) => {
      try {
        const { positions } = req.body;
        const db = testAdmin.getDb();
        const batch = db.batch();
        
        positions.forEach((position: EndgamePosition) => {
          const docRef = db.collection('positions').doc(position.id.toString());
          batch.set(docRef, position);
        });
        
        await batch.commit();
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.app.post('/e2e/firebase/seed-all', async (req, res) => {
      try {
        await testAdmin.createTestScenario('basic');
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.app.post('/e2e/firebase/create-user', async (req, res) => {
      try {
        const { email, password } = req.body;
        const db = testAdmin.getDb();
        const mockUid = 'test-user-' + Date.now();
        
        await db.collection('users').doc(mockUid).set({
          uid: mockUid,
          email: email,
          displayName: email.split('@')[0],
          createdAt: new Date(),
          settings: {
            theme: 'light',
            soundEnabled: true,
            autoPlay: false
          }
        });
        
        res.json({ success: true, user: { uid: mockUid, email } });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Make a move directly in database
    this.app.post('/e2e/make-move', async (req, res) => {
      try {
        const { positionId, move, userId = 'test-user' } = req.body;
        
        // Record move in database
        const db = testAdmin.getDb();
        await db.collection('moves').add({
          positionId,
          userId,
          move,
          timestamp: new Date(),
          source: 'e2e-test'
        });

        res.json({ success: true, move });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Set game state
    this.app.post('/e2e/set-game-state', async (req, res) => {
      try {
        const { positionId, fen, moveHistory = [] } = req.body;
        
        const db = testAdmin.getDb();
        await db.collection('game-states').doc(`${positionId}-test`).set({
          positionId,
          fen,
          moveHistory,
          lastUpdated: new Date()
        });

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Create test user with progress
    this.app.post('/e2e/create-test-user', async (req, res) => {
      try {
        const { userId = 'test-user', progress = {} } = req.body;
        
        const db = testAdmin.getDb();
        
        // Create user
        await db.collection('users').doc(userId).set({
          email: `${userId}@test.com`,
          displayName: `Test User ${userId}`,
          createdAt: new Date(),
          isTestUser: true
        });

        // Set progress with type safety
        for (const [positionId, data] of Object.entries(progress)) {
          // Type guard to ensure data is an object
          if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            await db.collection('progress').doc(`${userId}-${positionId}`).set({
              userId,
              positionId: parseInt(positionId),
              ...data,
              lastUpdated: new Date()
            });
          } else {
            console.warn(`Skipping invalid progress data for position ${positionId}`);
          }
        }

        res.json({ success: true, userId });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Seed specific scenario
    this.app.post('/e2e/seed-scenario', async (req, res) => {
      try {
        const { scenario } = req.body;
        await testAdmin.createTestScenario(scenario);
        res.json({ success: true, scenario });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Clear all data
    this.app.post('/e2e/clear-all', async (req, res) => {
      try {
        await testAdmin.clearAllData();
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Get current game state
    this.app.get('/e2e/game-state/:positionId', async (req, res) => {
      try {
        const { positionId } = req.params;
        
        const db = testAdmin.getDb();
        const doc = await db.collection('game-states').doc(`${positionId}-test`).get();
        
        if (!doc.exists) {
          return res.status(404).json({ error: 'Game state not found' });
        }

        res.json(doc.data());
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Verify data integrity
    this.app.get('/e2e/verify-integrity', async (req, res) => {
      try {
        const result = await testAdmin.verifyDataIntegrity();
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Trigger engine analysis
    this.app.post('/e2e/analyze-position', async (req, res) => {
      try {
        const { fen, depth = 20 } = req.body;
        
        // This would integrate with your engine service
        // For now, return mock analysis
        const mockAnalysis = {
          fen,
          evaluation: Math.random() * 200 - 100,
          bestMove: 'e2e4',
          depth,
          nodes: 1000000
        };

        res.json(mockAnalysis);
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });
  }

  async start(): Promise<void> {
    await testAdmin.initialize();
    
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🧪 Test API Server running on http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('🛑 Test API Server stopped');
          resolve();
        });
      });
    }
  }

  getUrl(): string {
    return `http://localhost:${this.port}`;
  }
}

// Export singleton instance
export const testApiServer = new TestApiServer();