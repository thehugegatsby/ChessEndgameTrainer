/**
 * @fileoverview Tests for Platform Service
 * @description Tests platform detection and service factory functionality
 */

import { getPlatformService, getPlatformDetection, resetPlatformService } from '@/services/platform/PlatformService';
import { WebPlatformService } from '@/services/platform/web/WebPlatformService';

// Mock window object for testing
const mockWindow = {
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    onLine: true,
    maxTouchPoints: 0
  },
  document: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    referrer: 'https://example.com'
  },
  matchMedia: jest.fn(() => ({
    matches: false
  })),
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
  },
  performance: {
    now: jest.fn(() => Date.now())
  }
};

// Setup global mocks
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: mockWindow.navigator,
  writable: true
});

Object.defineProperty(global, 'document', {
  value: mockWindow.document,
  writable: true
});

describe.each(['web', 'mobile'])('Platform: %s - PlatformDetection', (platform) => {
  let detection: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Configure environment for platform
    if (platform === 'mobile') {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockWindow.navigator,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        },
        writable: true
      });
    } else {
      Object.defineProperty(global, 'navigator', {
        value: mockWindow.navigator,
        writable: true
      });
    }
    
    resetPlatformService();
    detection = getPlatformDetection();
  });

  describe('isWeb', () => {
    it('should detect web environment', () => {
      expect(detection.isWeb()).toBe(true);
    });

    it('should return false in non-web environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      // Create new detection instance after removing window
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isWeb()).toBe(false);
      
      // Restore window
      global.window = originalWindow;
    });
  });

  describe('isMobile', () => {
    it('should detect iPhone user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockWindow.navigator,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        },
        writable: true,
        configurable: true
      });
      
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isMobile()).toBe(true);
    });

    it('should detect Android user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockWindow.navigator,
          userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)'
        },
        writable: true,
        configurable: true
      });
      
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isMobile()).toBe(true);
    });

    it('should detect iPad user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockWindow.navigator,
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)'
        },
        writable: true,
        configurable: true
      });
      
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isMobile()).toBe(true);
    });

    it('should not detect desktop as mobile', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockWindow.navigator,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        writable: true,
        configurable: true
      });
      
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isMobile()).toBe(false);
    });

    it('should detect React Native environment', () => {
      (window as any).ReactNativeWebView = true;
      
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isMobile()).toBe(true);
      
      delete (window as any).ReactNativeWebView;
    });
  });

  describe('isAndroid', () => {
    it('should detect Android user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
        writable: true
      });
      
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isAndroid()).toBe(true);
    });

    it('should detect Android flag', () => {
      (window as any).isAndroid = true;
      
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isAndroid()).toBe(true);
      
      delete (window as any).isAndroid;
    });
  });

  describe('isIOS', () => {
    it('should detect iOS user agents', () => {
      const iosUserAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X)'
      ];

      iosUserAgents.forEach(userAgent => {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          writable: true
        });
        
        resetPlatformService();
        detection = getPlatformDetection();
        
        expect(detection.isIOS()).toBe(true);
      });
    });
  });

  describe('isDesktop', () => {
    it('should detect desktop (web but not mobile)', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true
      });
      
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isDesktop()).toBe(true);
    });
  });

  describe('isTouchDevice', () => {
    it('should detect touch support via ontouchstart', () => {
      (window as any).ontouchstart = true;
      
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isTouchDevice()).toBe(true);
      
      delete (window as any).ontouchstart;
    });

    it('should detect touch support via maxTouchPoints', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        writable: true
      });
      
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isTouchDevice()).toBe(true);
    });
  });

  describe('isStandalone', () => {
    it('should detect PWA standalone mode', () => {
      window.matchMedia = jest.fn((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }));
      
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isStandalone()).toBe(true);
    });

    it('should detect iOS standalone mode', () => {
      (navigator as any).standalone = true;
      
      resetPlatformService();
      detection = getPlatformDetection();
      
      expect(detection.isStandalone()).toBe(true);
      
      delete (navigator as any).standalone;
    });
  });
});

describe('PlatformService', () => {
  // Mock localStorage for storage tests
  const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
  };

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: mockStorage });
    resetPlatformService();
  });

  describe('Service Factory', () => {
    it('should return WebPlatformService for web environment', () => {
      const service = getPlatformService();
      expect(service).toBeInstanceOf(WebPlatformService);
    });

    it('should return singleton instance', () => {
      const service1 = getPlatformService();
      const service2 = getPlatformService();
      
      expect(service1).toBe(service2);
    });

    it('should reset service instance', () => {
      const service1 = getPlatformService();
      resetPlatformService();
      const service2 = getPlatformService();
      
      expect(service1).not.toBe(service2);
    });
  });

  describe('Service Interface', () => {
    let service: any;

    beforeEach(() => {
      service = getPlatformService();
    });

    it('should have all required service interfaces', () => {
      expect(service.storage).toBeDefined();
      expect(service.notifications).toBeDefined();
      expect(service.device).toBeDefined();
      expect(service.performance).toBeDefined();
      expect(service.clipboard).toBeDefined();
      expect(service.share).toBeDefined();
      expect(service.analytics).toBeDefined();
    });

    it('should have storage interface methods', () => {
      expect(typeof service.storage.save).toBe('function');
      expect(typeof service.storage.load).toBe('function');
      expect(typeof service.storage.remove).toBe('function');
      expect(typeof service.storage.clear).toBe('function');
      expect(typeof service.storage.getAllKeys).toBe('function');
    });

    it('should have device interface methods', () => {
      expect(typeof service.device.getPlatform).toBe('function');
      expect(typeof service.device.getDeviceInfo).toBe('function');
      expect(typeof service.device.getMemoryInfo).toBe('function');
      expect(typeof service.device.getNetworkStatus).toBe('function');
      expect(typeof service.device.isLowEndDevice).toBe('function');
    });
  });
});