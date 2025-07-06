/**
 * Factory for creating storage implementations
 */

import { StoragePort, StorageConfig } from './StoragePort';
import { FileStorage } from './FileStorage';
import { MemoryStorage } from './MemoryStorage';

export class StorageFactory {
  static createStorage(config?: StorageConfig): StoragePort {
    // Use memory storage in browser environment
    if (typeof window !== 'undefined') {
      return new MemoryStorage();
    }
    
    // Default to file storage in development, memory in test
    const storageType = config?.type || 
      (process.env.NODE_ENV === 'test' ? 'memory' : 'file');
    
    switch (storageType) {
      case 'file':
        return new FileStorage(config?.filePath);
        
      case 'memory':
        return new MemoryStorage();
        
      case 'redis':
        // TODO: Implement RedisStorage when needed
        console.warn('Redis storage not yet implemented, falling back to memory storage');
        return new MemoryStorage();
        
      default:
        throw new Error(`Unknown storage type: ${storageType}`);
    }
  }
}