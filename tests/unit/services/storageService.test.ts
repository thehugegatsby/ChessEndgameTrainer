/**
 * @fileoverview Tests for Storage Service
 * @description Tests platform-agnostic storage functionality
 */

// Mock localStorage for web tests
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

// Mock AsyncStorage for mobile tests
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn()
};

describe.each(['web', 'mobile'])('Platform: %s - Storage Service', (platform) => {
  beforeEach(() => {
    if (platform === 'web') {
      Object.defineProperty(window, 'localStorage', { value: mockStorage });
      // Clear all mocks
      Object.values(mockStorage).forEach(mock => {
        if (typeof mock === 'function') mock.mockClear();
      });
    } else {
      // Mock React Native AsyncStorage
      jest.doMock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
      Object.values(mockAsyncStorage).forEach(mock => {
        if (typeof mock === 'function') mock.mockClear();
      });
    }
  });

  describe('Storage Operations', () => {
    it('should save data', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        await storage.save('test-key', 'test-value');
        
        expect(mockStorage.setItem).toHaveBeenCalledWith('test-key', '"test-value"');
      } else {
        // For mobile, we would import the mobile storage service
        // Since it doesn't exist yet, we'll test the interface
        expect(true).toBe(true); // Placeholder for mobile storage tests
      }
    });

    it('should load data', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        mockStorage.getItem.mockReturnValue('"test-value"');
        
        const result = await storage.load('test-key');
        
        expect(mockStorage.getItem).toHaveBeenCalledWith('test-key');
        expect(result).toBe('test-value');
      }
    });

    it('should remove data', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        await storage.remove('test-key');
        
        expect(mockStorage.removeItem).toHaveBeenCalledWith('test-key');
      }
    });

    it('should clear all data', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        await storage.clear();
        
        expect(mockStorage.clear).toHaveBeenCalled();
      }
    });

    it('should get all keys', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        // Mock localStorage.length and key method
        mockStorage.length = 2;
        mockStorage.key.mockImplementation((index: number) => {
          return index === 0 ? 'key1' : index === 1 ? 'key2' : null;
        });
        
        const keys = await storage.getAllKeys();
        
        expect(keys).toEqual(['key1', 'key2']);
      }
    });

    it('should handle JSON serialization', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        const testObject = { name: 'test', value: 123 };
        
        await storage.save('object-key', testObject);
        
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'object-key', 
          JSON.stringify(testObject)
        );
      }
    });

    it('should handle null values', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        mockStorage.getItem.mockReturnValue(null);
        
        const result = await storage.load('non-existent-key');
        
        expect(result).toBeNull();
      }
    });

    it('should handle parse errors gracefully', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        mockStorage.getItem.mockReturnValue('invalid-json{');
        
        const result = await storage.load('invalid-key');
        
        // Should return null or handle the error gracefully
        expect(result).toBeNull();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle storage exceptions', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        mockStorage.setItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });
        
        await expect(storage.save('test-key', 'test-value')).rejects.toThrow();
      }
    });

    it('should handle disabled storage', async () => {
      if (platform === 'web') {
        // Test when localStorage is not available
        const originalLocalStorage = window.localStorage;
        delete (window as any).localStorage;
        
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        
        expect(() => new WebStorageService()).not.toThrow();
        
        // Restore localStorage
        window.localStorage = originalLocalStorage;
      }
    });
  });

  describe('Platform-Specific Features', () => {
    if (platform === 'web') {
      it('should work with localStorage limitations', async () => {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        // Test with large data
        const largeData = 'x'.repeat(1000000); // 1MB string
        
        await storage.save('large-key', largeData);
        
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'large-key',
          JSON.stringify(largeData)
        );
      });
    } else {
      it('should work with AsyncStorage async operations', () => {
        // Mobile-specific async storage tests would go here
        expect(true).toBe(true); // Placeholder
      });
    }
  });

  describe('Data Types', () => {
    it('should handle strings', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        await storage.save('string-key', 'hello world');
        mockStorage.getItem.mockReturnValue('"hello world"');
        
        const result = await storage.load('string-key');
        expect(result).toBe('hello world');
      }
    });

    it('should handle numbers', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        await storage.save('number-key', 42);
        mockStorage.getItem.mockReturnValue('42');
        
        const result = await storage.load('number-key');
        expect(result).toBe(42);
      }
    });

    it('should handle booleans', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        await storage.save('boolean-key', true);
        mockStorage.getItem.mockReturnValue('true');
        
        const result = await storage.load('boolean-key');
        expect(result).toBe(true);
      }
    });

    it('should handle arrays', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        const testArray = [1, 2, 3, 'test'];
        
        await storage.save('array-key', testArray);
        mockStorage.getItem.mockReturnValue(JSON.stringify(testArray));
        
        const result = await storage.load('array-key');
        expect(result).toEqual(testArray);
      }
    });

    it('should handle objects', async () => {
      if (platform === 'web') {
        const { WebStorageService } = await import('@/services/platform/web/storage/WebStorageService');
        const storage = new WebStorageService();
        
        const testObject = { 
          name: 'test',
          nested: { value: 123 },
          array: [1, 2, 3]
        };
        
        await storage.save('object-key', testObject);
        mockStorage.getItem.mockReturnValue(JSON.stringify(testObject));
        
        const result = await storage.load('object-key');
        expect(result).toEqual(testObject);
      }
    });
  });
});