import { Engine } from '@shared/lib/chess/engine/index';
import { EngineConfig, WorkerConfig } from '@shared/lib/chess/engine/types';

describe('Engine', () => {
  // Debug: Check if Engine is imported correctly
  it('should have Engine constructor', () => {
    expect(Engine).toBeDefined();
    expect(typeof Engine).toBe('function');
  });

  describe('initialization and cleanup', () => {
    describe('constructor', () => {
      it('should create instance with valid options', () => {
        const validEngineConfig: EngineConfig = {
          maxDepth: 15,
          maxTime: 1000,
          maxNodes: 1000000,
          useThreads: 1,
          hashSize: 64,
          skillLevel: 10
        };
        
        expect(() => new Engine(validEngineConfig)).not.toThrow();
      });

      it('should create instance without options', () => {
        expect(() => new Engine()).not.toThrow();
      });

      it('should reject invalid options', () => {
        // Test negative maxDepth
        const invalidConfig: EngineConfig = {
          maxDepth: -1,
          maxTime: 1000,
          maxNodes: 1000000,
          useThreads: 1,
          hashSize: 64
        };
        expect(() => new Engine(invalidConfig)).toThrow('maxDepth must be positive');

        // Test negative maxTime
        expect(() => new Engine({ 
          maxDepth: 15,
          maxTime: -100,
          maxNodes: 1000000,
          useThreads: 1,
          hashSize: 64
        })).toThrow('maxTime must be positive');

        // Test invalid useThreads (must be 1 for mobile)
        expect(() => new Engine({ 
          maxDepth: 15,
          maxTime: 1000,
          maxNodes: 1000000,
          useThreads: 4,
          hashSize: 64
        })).toThrow('useThreads must be 1 for mobile');

        // Test invalid hashSize
        expect(() => new Engine({ 
          maxDepth: 15,
          maxTime: 1000,
          maxNodes: 1000000,
          useThreads: 1,
          hashSize: 256
        })).toThrow('hashSize must be between 1 and 128 MB');

        // Test invalid skillLevel
        expect(() => new Engine({ 
          maxDepth: 15,
          maxTime: 1000,
          maxNodes: 1000000,
          useThreads: 1,
          hashSize: 64,
          skillLevel: 25
        })).toThrow('skillLevel must be between 0 and 20');
      });

      it('should reject invalid workerConfig', () => {
        const workerConfig: WorkerConfig = {
          workerPath: '../../../malicious/path'
        };
        
        expect(() => new Engine(undefined, workerConfig)).toThrow('workerPath cannot contain "../"');
      });
    });
  });
});