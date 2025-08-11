/**
 * @file Platform Service Factory
 * @module services/platform/PlatformService
 *
 * @description
 * Provides the correct platform implementation based on the environment.
 * Supports web, mobile (React Native), and desktop platforms with
 * automatic detection and appropriate service instantiation.
 *
 * @remarks
 * The platform service abstracts platform-specific functionality like:
 * - Storage (localStorage, AsyncStorage, etc.)
 * - Navigation (browser history, React Navigation, etc.)
 * - Device capabilities (touch, screen size, etc.)
 * - Platform-specific APIs
 */

import { type PlatformService, type PlatformDetection } from "./types";
import { WebPlatformService } from "./web/WebPlatformService";
import { getLogger } from "@shared/services/logging";

/**
 * Platform detection implementation
 *
 * @class PlatformDetection
 * @implements {PlatformDetection}
 *
 * @description
 * Provides methods to detect the current platform and device type.
 * Uses user agent analysis and platform-specific APIs for detection.
 */
class PlatformDetectionImpl implements PlatformDetection {
  /**
   * Detects if running in a web browser environment
   *
   * @returns {boolean} True if running in a browser
   *
   * @example
   * ```typescript
   * if (platformDetection.isWeb()) {
   *   // Use browser-specific features
   * }
   * ```
   */
  isWeb(): boolean {
    return typeof window !== "undefined" && typeof document !== "undefined";
  }

  /**
   * Detects if running on a mobile device
   *
   * @returns {boolean} True if mobile device or React Native
   *
   * @remarks
   * Checks for React Native environment first, then falls back
   * to user agent detection for mobile browsers.
   *
   * @example
   * ```typescript
   * if (platformDetection.isMobile()) {
   *   // Enable touch controls
   * }
   * ```
   */
  isMobile(): boolean {
    if (typeof window === "undefined") return false;

    // Check for React Native
    if ((window as unknown as Record<string, unknown>)['ReactNativeWebView']) return true;

    // Check for mobile user agents
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent,
    );
  }

  isAndroid(): boolean {
    if (typeof window === "undefined") return false;

    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes("android") || (window as unknown as Record<string, unknown>)['isAndroid'] === true;
  }

  isIOS(): boolean {
    if (typeof window === "undefined") return false;

    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent) || (window as unknown as Record<string, unknown>)['isIOS'] === true;
  }

  isDesktop(): boolean {
    return this.isWeb() && !this.isMobile();
  }

  isTouchDevice(): boolean {
    if (typeof window === "undefined") return false;

    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      ((navigator as unknown as Record<string, unknown>)['msMaxTouchPoints'] as number) > 0
    );
  }

  isStandalone(): boolean {
    if (typeof window === "undefined") return false;

    // Check if running as PWA
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as Record<string, unknown>)['standalone'] === true ||
      document.referrer.includes("android-app://")
    );
  }
}

// Singleton instance
let platformServiceInstance: PlatformService | null = null;
let platformDetectionInstance: PlatformDetection | null = null;

/**
 * Get the platform service instance
 * This will return the appropriate implementation based on the platform
 */
export function getPlatformService(): PlatformService {
  if (!platformServiceInstance) {
    const detection = getPlatformDetection();

    if (detection.isWeb() && !detection.isMobile()) {
      // Web browser implementation
      platformServiceInstance = new WebPlatformService();
    } else if (detection.isAndroid() || detection.isIOS()) {
      // Mobile implementation (to be implemented)
      // For now, fallback to web implementation
      platformServiceInstance = new WebPlatformService();
      const logger = getLogger();
      logger.warn("Using Web implementation for mobile platform");
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
export function getPlatformDetection(): PlatformDetection {
  if (!platformDetectionInstance) {
    platformDetectionInstance = new PlatformDetectionImpl();
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
export * from "./types";
