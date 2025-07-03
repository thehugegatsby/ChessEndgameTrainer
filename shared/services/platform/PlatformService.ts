/**
 * Platform Service Factory
 * Provides the correct platform implementation based on the environment
 */

import { IPlatformService, IPlatformDetection } from './types';
import { WebPlatformService } from './web/WebPlatformService';

// Platform detection implementation
class PlatformDetection implements IPlatformDetection {
  isWeb(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for React Native
    if ((window as any).ReactNativeWebView) return true;
    
    // Check for mobile user agents
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  }

  isAndroid(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('android') || (window as any).isAndroid === true;
  }

  isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent) || (window as any).isIOS === true;
  }

  isDesktop(): boolean {
    return this.isWeb() && !this.isMobile();
  }

  isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 ||
           (navigator as any).msMaxTouchPoints > 0;
  }

  isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check if running as PWA
    return (window.matchMedia('(display-mode: standalone)').matches) ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }
}

// Singleton instance
let platformServiceInstance: IPlatformService | null = null;
let platformDetectionInstance: IPlatformDetection | null = null;

/**
 * Get the platform service instance
 * This will return the appropriate implementation based on the platform
 */
export function getPlatformService(): IPlatformService {
  if (!platformServiceInstance) {
    const detection = getPlatformDetection();
    
    if (detection.isWeb() && !detection.isMobile()) {
      // Web browser implementation
      platformServiceInstance = new WebPlatformService();
    } else if (detection.isAndroid() || detection.isIOS()) {
      // Mobile implementation (to be implemented)
      // For now, fallback to web implementation
      platformServiceInstance = new WebPlatformService();
      console.warn('Using Web implementation for mobile platform');
    } else {
      // Default to web implementation
      platformServiceInstance = new WebPlatformService();
    }
  }
  
  return platformServiceInstance;
}

/**
 * Get the platform detection instance
 */
export function getPlatformDetection(): IPlatformDetection {
  if (!platformDetectionInstance) {
    platformDetectionInstance = new PlatformDetection();
  }
  return platformDetectionInstance;
}

/**
 * Reset platform service (useful for testing)
 */
export function resetPlatformService(): void {
  platformServiceInstance = null;
}

// Export types for convenience
export * from './types';