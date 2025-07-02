/**
 * @fileoverview Mobile Storage Service
 * @version 1.0.0
 * @description Storage service optimized for mobile devices and Android apps
 * Handles offline data, progress tracking, and efficient local storage
 */

import type { 
  EndgamePosition, 
  UserProgress, 
  TrainingSession, 
  MobileAppConfig 
} from '../../data/endgames/types';

/**
 * Mobile-optimized storage service for chess training app
 * Handles offline functionality and efficient data persistence
 */
export class MobileStorageService {
  private readonly storagePrefix = 'chess_training_';
  private readonly maxStorageSize = 50 * 1024 * 1024; // 50MB limit for mobile
  private compressionEnabled = true;

  constructor() {
    this.initializeStorage();
  }

  /**
   * Initializes storage and checks capacity
   */
  private initializeStorage(): void {
    this.checkStorageCapacity();
    this.migrateOldData();
  }

  /**
   * Checks available storage capacity
   */
  private async checkStorageCapacity(): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usedMB = (estimate.usage || 0) / 1024 / 1024;
        const quotaMB = (estimate.quota || 0) / 1024 / 1024;
        
        console.log(`[StorageService] 💾 Storage: ${usedMB.toFixed(1)}MB / ${quotaMB.toFixed(1)}MB`);
        
        if (usedMB > quotaMB * 0.8) {
          console.warn('[StorageService] 🚨 Storage nearly full - consider cleanup');
          this.cleanupOldData();
        }
      } catch (error) {
        console.warn('[StorageService] Could not estimate storage:', error);
      }
    }
  }

  /**
   * Migrates data from older app versions
   */
  private migrateOldData(): void {
    // Check for old data format and migrate if needed
    const oldProgress = localStorage.getItem('endgame_progress');
    if (oldProgress && !localStorage.getItem(this.getKey('user_progress'))) {
      try {
        const data = JSON.parse(oldProgress);
        this.saveUserProgress(data);
        localStorage.removeItem('endgame_progress');
        console.log('[StorageService] 🔄 Migrated old progress data');
      } catch (error) {
        console.warn('[StorageService] Failed to migrate old data:', error);
      }
    }
  }

  /**
   * Generates storage key with prefix
   */
  private getKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }

  /**
   * Compresses data for mobile storage efficiency
   */
  private compressData(data: any): string {
    const jsonString = JSON.stringify(data);
    
    if (!this.compressionEnabled || jsonString.length < 1000) {
      return jsonString;
    }

    // Simple compression by removing unnecessary whitespace and shortening keys
    return jsonString
      .replace(/\s+/g, ' ')
      .replace(/"(\w+)":/g, '"$1":'); // Keep quotes but minimize
  }

  /**
   * Decompresses data from storage
   */
  private decompressData(data: string): any {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('[StorageService] Failed to parse stored data:', error);
      return null;
    }
  }

  /**
   * Saves data to local storage with error handling
   */
  private saveToStorage(key: string, data: any): boolean {
    try {
      const compressedData = this.compressData(data);
      const fullKey = this.getKey(key);
      
      // Check if data would exceed reasonable size
      if (compressedData.length > 5 * 1024 * 1024) { // 5MB per item
        console.warn('[StorageService] Data too large to store:', key);
        return false;
      }
      
      localStorage.setItem(fullKey, compressedData);
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to save data:', error);
      
      // Try to free up space and retry
      if (error instanceof DOMException && error.code === 22) {
        this.cleanupOldData();
        try {
          localStorage.setItem(this.getKey(key), this.compressData(data));
          return true;
        } catch (retryError) {
          console.error('[StorageService] Retry failed:', retryError);
        }
      }
      return false;
    }
  }

  /**
   * Loads data from local storage
   */
  private loadFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(this.getKey(key));
      if (data === null) return defaultValue;
      
      const parsed = this.decompressData(data);
      return parsed !== null ? parsed : defaultValue;
    } catch (error) {
      console.error('[StorageService] Failed to load data:', error);
      return defaultValue;
    }
  }

  /**
   * Saves user progress data
   */
  public saveUserProgress(progress: Partial<UserProgress>): boolean {
    const currentProgress = this.loadUserProgress();
    const updatedProgress = { ...currentProgress, ...progress };
    
    // Convert Maps to objects for storage
    const storageProgress = {
      ...updatedProgress,
      positionProgress: Object.fromEntries(updatedProgress.positionProgress || new Map()),
      dueDates: Object.fromEntries(updatedProgress.dueDates || new Map()),
      intervals: Object.fromEntries(updatedProgress.intervals || new Map())
    };
    
    return this.saveToStorage('user_progress', storageProgress);
  }

  /**
   * Loads user progress data
   */
  public loadUserProgress(): UserProgress {
    const defaultProgress: UserProgress = {
      totalPositions: 0,
      completedPositions: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalStudyTime: 0,
      averageAccuracy: 0,
      positionProgress: new Map(),
      dueDates: new Map(),
      intervals: new Map()
    };

    const stored = this.loadFromStorage('user_progress', defaultProgress);
    
    // Convert objects back to Maps with proper key conversion
    return {
      ...stored,
      positionProgress: new Map(Object.entries(stored.positionProgress || {}).map(([k, v]) => [parseInt(k), v])),
      dueDates: new Map(Object.entries(stored.dueDates || {}).map(([k, v]) => [parseInt(k), new Date(v)])),
      intervals: new Map(Object.entries(stored.intervals || {}).map(([k, v]) => [parseInt(k), v]))
    };
  }

  /**
   * Saves a training session
   */
  public saveTrainingSession(session: TrainingSession): boolean {
    const sessions = this.loadTrainingSessions();
    sessions.push(session);
    
    // Keep only last 100 sessions for mobile storage efficiency
    if (sessions.length > 100) {
      sessions.splice(0, sessions.length - 100);
    }
    
    return this.saveToStorage('training_sessions', sessions);
  }

  /**
   * Loads training sessions
   */
  public loadTrainingSessions(): TrainingSession[] {
    return this.loadFromStorage('training_sessions', []);
  }

  /**
   * Saves app configuration
   */
  public saveAppConfig(config: Partial<MobileAppConfig>): boolean {
    const currentConfig = this.loadAppConfig();
    const updatedConfig = { ...currentConfig, ...config };
    return this.saveToStorage('app_config', updatedConfig);
  }

  /**
   * Loads app configuration with mobile defaults
   */
  public loadAppConfig(): MobileAppConfig {
    const defaultConfig: MobileAppConfig = {
      theme: 'auto',
      language: 'de',
      soundEnabled: true,
      vibrationEnabled: true,
      offlineModeEnabled: true,
      showHints: true,
      autoAdvance: false,
      dailyGoal: 5,
      reduceAnimations: false,
      lowPowerMode: false,
      preloadPositions: 10
    };

    return this.loadFromStorage('app_config', defaultConfig);
  }

  /**
   * Caches endgame positions for offline use
   */
  public cachePositionsForOffline(positions: EndgamePosition[]): boolean {
    // Only cache essential data for offline mode
    const offlineData = positions.map(pos => ({
      id: pos.id,
      title: pos.title,
      description: pos.description,
      fen: pos.fen,
      category: pos.category,
      difficulty: pos.difficulty,
      goal: pos.goal,
      sideToMove: pos.sideToMove,
      material: pos.material,
      tags: pos.tags
    }));

    return this.saveToStorage('offline_positions', offlineData);
  }

  /**
   * Loads cached positions for offline use
   */
  public loadOfflinePositions(): Partial<EndgamePosition>[] {
    return this.loadFromStorage('offline_positions', []);
  }

  /**
   * Updates position progress efficiently
   */
  public updatePositionProgress(
    positionId: number, 
    update: {
      rating?: number;
      timesPlayed?: number;
      successRate?: number;
      lastPlayed?: Date;
      averageTime?: number;
      needsReview?: boolean;
    }
  ): boolean {
    const progress = this.loadUserProgress();
    const currentPositionProgress = progress.positionProgress.get(positionId) || {
      rating: 1200,
      timesPlayed: 0,
      successRate: 0,
      lastPlayed: new Date(),
      averageTime: 0,
      needsReview: false
    };

    const updatedPositionProgress = { ...currentPositionProgress, ...update };
    progress.positionProgress.set(positionId, updatedPositionProgress);

    return this.saveUserProgress(progress);
  }

  /**
   * Cleans up old data to free storage space
   */
  private cleanupOldData(): void {
    console.log('[StorageService] 🧹 Cleaning up old data...');
    
    // Remove old training sessions (keep only last 50)
    const sessions = this.loadTrainingSessions();
    if (sessions.length > 50) {
      const recentSessions = sessions.slice(-50);
      this.saveToStorage('training_sessions', recentSessions);
    }

    // Clean up any other old keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        const age = Date.now() - parseInt(key.split('_').pop() || '0');
        if (age > 30 * 24 * 60 * 60 * 1000) { // Older than 30 days
          localStorage.removeItem(key);
        }
      }
    }
  }

  /**
   * Exports user data for backup
   */
  public exportUserData(): string {
    const data = {
      userProgress: this.loadUserProgress(),
      trainingSessions: this.loadTrainingSessions(),
      appConfig: this.loadAppConfig(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Imports user data from backup
   */
  public importUserData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.userProgress) {
        this.saveUserProgress(data.userProgress);
      }
      
      if (data.trainingSessions) {
        this.saveToStorage('training_sessions', data.trainingSessions);
      }
      
      if (data.appConfig) {
        this.saveAppConfig(data.appConfig);
      }
      
      console.log('[StorageService] ✅ User data imported successfully');
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to import data:', error);
      return false;
    }
  }

  /**
   * Gets storage statistics for debugging
   */
  public getStorageStats(): {
    totalKeys: number;
    estimatedSizeKB: number;
    progressSize: number;
    sessionsCount: number;
    offlinePositions: number;
  } {
    let totalSize = 0;
    let totalKeys = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        totalKeys++;
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
    }

    return {
      totalKeys,
      estimatedSizeKB: Math.round(totalSize / 1024),
      progressSize: this.loadUserProgress().positionProgress.size,
      sessionsCount: this.loadTrainingSessions().length,
      offlinePositions: this.loadOfflinePositions().length
    };
  }

  /**
   * Clears all app data (factory reset)
   */
  public clearAllData(): void {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        keys.push(key);
      }
    }

    keys.forEach(key => localStorage.removeItem(key));
    console.log('[StorageService] 🗑️ All app data cleared');
  }
}

// Global singleton instance for mobile app
export const mobileStorageService = new MobileStorageService(); 