/**
 * Firebase Test API Routes
 * HTTP layer for Firebase test operations - delegates to service layer
 */

import { Router } from 'express';
import { 
  FirebaseTestService, 
  type CreateUserOptions,
  type EnhancedBatchOptions,
  type BatchSeedData
} from './firebase-test-service';
import { type ScenarioName } from '../e2e/firebase';

const router = Router();

// Type definitions for request payloads
interface SeedScenarioRequest {
  scenario: ScenarioName;
  options?: {
    userCount?: number;
    includeProgress?: boolean;
  };
}

interface BatchSeedRequest {
  positions?: any[];
  categories?: any[];
  chapters?: any[];
  users?: CreateUserOptions[];
}

interface AdvancedBatchSeedRequest extends BatchSeedRequest {
  options?: EnhancedBatchOptions;
}

interface AdvancedScenarioRequest {
  scenario: ScenarioName;
  options?: EnhancedBatchOptions & {
    userCount?: number;
    includeProgress?: boolean;
  };
}

/**
 * Centralized error handler for consistent error responses
 */
function handleError(error: unknown, operation: string, res: any) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const statusCode = error instanceof Error && error.message.includes('Invalid') ? 400 : 500;
  
  console.error(`Firebase API Error [${operation}]:`, error);
  
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    code: `FIREBASE_${operation.toUpperCase()}_FAILED`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Setup Firebase test environment
 */
router.post('/setup', async (req, res) => {
  try {
    await FirebaseTestService.setup();
    res.json({ 
      success: true, 
      message: 'Firebase test environment initialized',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(error, 'setup', res);
  }
});

/**
 * Clear all Firestore data
 */
router.post('/clear', async (req, res) => {
  try {
    await FirebaseTestService.clearAll();
    res.json({ 
      success: true, 
      message: 'Firestore data cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(error, 'clear', res);
  }
});

/**
 * Create test user based on template
 */
router.post('/create-user', async (req, res) => {
  try {
    const options: CreateUserOptions = req.body;
    const result = await FirebaseTestService.createUser(options);
    
    res.status(201).json({ 
      success: true, 
      user: result.user,
      progressEntries: result.progressEntries
    });
  } catch (error) {
    handleError(error, 'create-user', res);
  }
});

/**
 * Seed test scenario
 */
router.post('/seed-scenario', async (req, res) => {
  try {
    const { scenario, options = {} }: SeedScenarioRequest = req.body;
    const result = await FirebaseTestService.seedScenario(scenario, options);
    
    res.json({ 
      success: true, 
      ...result
    });
  } catch (error) {
    handleError(error, 'seed-scenario', res);
  }
});

/**
 * Batch seed custom data
 */
router.post('/seed-batch', async (req, res) => {
  try {
    const data: BatchSeedRequest = req.body;
    const results = await FirebaseTestService.seedBatch(data);
    
    res.json({ 
      success: true, 
      message: 'Batch seeding completed',
      results
    });
  } catch (error) {
    handleError(error, 'seed-batch', res);
  }
});

/**
 * Get Firebase emulator status
 */
router.get('/status', async (req, res) => {
  try {
    const result = await FirebaseTestService.getStatus();
    
    res.json({ 
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(error, 'status', res);
  }
});

/**
 * Verify data integrity
 */
router.get('/verify-integrity', async (req, res) => {
  try {
    const result = await FirebaseTestService.verifyIntegrity();
    
    res.json({ 
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(error, 'verify-integrity', res);
  }
});

/**
 * Advanced batch seed with progress tracking and comprehensive validation
 */
router.post('/seed-batch-advanced', async (req, res) => {
  try {
    const data: AdvancedBatchSeedRequest = req.body;
    const { positions = [], categories = [], chapters = [], users = [], options = {} } = data;
    
    const result = await FirebaseTestService.seedBatchAdvanced(
      { positions, categories, chapters, users },
      options
    );
    
    res.json({ 
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(error, 'seed-batch-advanced', res);
  }
});

/**
 * Advanced scenario seeding with enhanced options
 */
router.post('/seed-scenario-advanced', async (req, res) => {
  try {
    const { scenario, options = {} }: AdvancedScenarioRequest = req.body;
    const result = await FirebaseTestService.seedScenarioAdvanced(scenario, options);
    
    res.json({ 
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(error, 'seed-scenario-advanced', res);
  }
});

/**
 * Get comprehensive seeding statistics and performance metrics
 */
router.get('/seeding-statistics', async (req, res) => {
  try {
    const result = await FirebaseTestService.getSeedingStatistics();
    
    res.json({ 
      success: true,
      statistics: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(error, 'seeding-statistics', res);
  }
});

export default router;