/**
 * @fileoverview Mobile Notification Service
 * @version 1.0.0
 * @description Notification service for mobile devices and Android app
 * Handles training reminders, achievements, and progressive web app notifications
 * 
 * FUTURE IMPLEMENTATION - MOBILE
 * This service is a placeholder for the upcoming mobile app implementation.
 * Currently not in use but kept for future React Native integration.
 */

import type { MobileAppConfig, TrainingSession } from '../../data/endgames/types';
import { mobileStorageService } from './storageService';

/**
 * Mobile notification service for chess training app
 * Handles achievements, reminders, and progress notifications
 */
export class MobileNotificationService {
  private notificationPermission: NotificationPermission = 'default';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private achievementQueue: Achievement[] = [];

  constructor() {
    this.initializeNotifications();
  }

  /**
   * Initializes notification system
   */
  private async initializeNotifications(): Promise<void> {
    // Check notification support
    if (!('Notification' in window)) {
      return;
    }

    this.notificationPermission = Notification.permission;

    // Register service worker for background notifications
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
      }
    }

    // Set up daily reminder check
    this.setupDailyReminderCheck();
  }

  /**
   * Requests notification permission
   */
  public async requestPermission(): Promise<boolean> {
    if (this.notificationPermission === 'granted') {
      return true;
    }

    try {
      this.notificationPermission = await Notification.requestPermission();
      return this.notificationPermission === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * Shows a local notification
   */
  private async showNotification(
    title: string,
    options: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      requireInteraction?: boolean;
    }
  ): Promise<void> {
    if (this.notificationPermission !== 'granted') {
      return;
    }

    const notificationOptions = {
      icon: '/icon-192.png',
      badge: '/icon-monochrome.png',
      ...options
    };

    try {
      if (this.serviceWorkerRegistration) {
        // Use service worker for better mobile support
        await this.serviceWorkerRegistration.showNotification(title, notificationOptions);
      } else {
        // Fallback to local notification
        new Notification(title, notificationOptions);
      }
    } catch (error) {
    }
  }

  /**
   * Shows training reminder notification
   */
  public async showTrainingReminder(positionsCount: number): Promise<void> {
    const config = mobileStorageService.loadAppConfig();
    
    if (!config.reminderTime) return;

    await this.showNotification(
      '🎯 Zeit zum Schach-Training!',
      {
        body: `Du hast ${positionsCount} Stellungen zu wiederholen. Bereit für eine kurze Trainingseinheit?`,
        tag: 'training-reminder',
        data: { type: 'training-reminder', positionsCount },
        requireInteraction: false
      }
    );
  }

  /**
   * Shows achievement notification
   */
  public async showAchievement(achievement: Achievement): Promise<void> {
    await this.showNotification(
      `🏆 ${achievement.title}`,
      {
        body: achievement.description,
        tag: `achievement-${achievement.id}`,
        data: { type: 'achievement', achievement },
        requireInteraction: true
      }
    );
  }

  /**
   * Shows streak milestone notification
   */
  public async showStreakMilestone(streak: number): Promise<void> {
    const milestone = this.getStreakMilestone(streak);
    if (!milestone) return;

    await this.showNotification(
      `🔥 ${streak} Tage Serie!`,
      {
        body: `Unglaublich! Du hast ${streak} Tage in Folge trainiert. ${milestone.message}`,
        tag: 'streak-milestone',
        data: { type: 'streak', streak },
        requireInteraction: true
      }
    );
  }

  /**
   * Shows progress notification
   */
  public async showProgressUpdate(progress: {
    completedPositions: number;
    totalPositions: number;
    category?: string;
  }): Promise<void> {
    const percentage = Math.round((progress.completedPositions / progress.totalPositions) * 100);
    
    if (percentage % 25 === 0 && percentage > 0) { // Show at 25%, 50%, 75%, 100%
      const categoryText = progress.category ? ` in ${progress.category}` : '';
      
      await this.showNotification(
        `📊 ${percentage}% Fortschritt erreicht!`,
        {
          body: `Du hast ${progress.completedPositions} von ${progress.totalPositions} Stellungen${categoryText} gemeistert.`,
          tag: 'progress-update',
          data: { type: 'progress', ...progress },
          requireInteraction: false
        }
      );
    }
  }

  /**
   * Checks and awards achievements based on session
   */
  public checkAndAwardAchievements(session: TrainingSession, userProgress: any): Achievement[] {
    const newAchievements: Achievement[] = [];

    // Perfect session achievement
    if (session.result === 'success' && session.mistakes === 0) {
      const achievement = this.createAchievement(
        'perfect-session',
        'Perfekte Lösung!',
        'Du hast eine Stellung ohne Fehler gelöst.',
        '🎯'
      );
      newAchievements.push(achievement);
    }

    // Speed achievement
    if (session.result === 'success' && session.timeSpent < 30) {
      const achievement = this.createAchievement(
        'speed-demon',
        'Blitzschnell!',
        'Du hast eine Stellung in unter 30 Sekunden gelöst.',
        '⚡'
      );
      newAchievements.push(achievement);
    }

    // First win achievement
    if (session.result === 'success' && userProgress.completedPositions === 1) {
      const achievement = this.createAchievement(
        'first-win',
        'Erster Erfolg!',
        'Du hast deine erste Endspiel-Stellung erfolgreich gelöst.',
        '🎉'
      );
      newAchievements.push(achievement);
    }

    // Milestone achievements
    const milestones = [10, 25, 50, 100, 250, 500];
    milestones.forEach(milestone => {
      if (userProgress.completedPositions === milestone) {
        const achievement = this.createAchievement(
          `milestone-${milestone}`,
          `${milestone} Stellungen gemeistert!`,
          `Du hast bereits ${milestone} Endspiel-Stellungen erfolgreich gelöst.`,
          '🏆'
        );
        newAchievements.push(achievement);
      }
    });

    // Show achievements
    newAchievements.forEach(achievement => {
      this.achievementQueue.push(achievement);
      this.showAchievement(achievement);
    });

    return newAchievements;
  }

  /**
   * Sets up daily reminder check
   */
  private setupDailyReminderCheck(): void {
    const checkReminder = () => {
      const config = mobileStorageService.loadAppConfig();
      
      if (!config.reminderTime) return;

      const now = new Date();
      const [hours, minutes] = config.reminderTime.split(':').map(Number);
      const reminderTime = new Date(now);
      reminderTime.setHours(hours, minutes, 0, 0);

      // If reminder time has passed today, set for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const timeUntilReminder = reminderTime.getTime() - now.getTime();

      setTimeout(() => {
        // Check if user needs to train
        const progress = mobileStorageService.loadUserProgress();
        const sessions = mobileStorageService.loadTrainingSessions();
        const todaySessions = sessions.filter(s => 
          new Date(s.startTime).toDateString() === new Date().toDateString()
        );

        if (todaySessions.length < config.dailyGoal) {
          const remainingPositions = config.dailyGoal - todaySessions.length;
          this.showTrainingReminder(remainingPositions);
        }

        // Set up next reminder
        this.setupDailyReminderCheck();
      }, timeUntilReminder);
    };

    checkReminder();
  }

  /**
   * Creates an achievement object
   */
  private createAchievement(
    id: string,
    title: string,
    description: string,
    icon: string
  ): Achievement {
    return {
      id,
      title,
      description,
      icon,
      unlockedAt: new Date(),
      category: 'general'
    };
  }

  /**
   * Gets streak milestone message
   */
  private getStreakMilestone(streak: number): { message: string } | null {
    const milestones = {
      7: 'Eine ganze Woche!',
      14: 'Zwei Wochen in Folge!',
      30: 'Ein ganzer Monat!',
      60: 'Zwei Monate!',
      90: 'Drei Monate!',
      365: 'Ein ganzes Jahr! Unglaublich!'
    };

    const message = milestones[streak as keyof typeof milestones];
    return message ? { message } : null;
  }

  /**
   * Schedules a notification for later
   */
  public scheduleNotification(
    title: string,
    body: string,
    scheduledTime: Date,
    tag?: string
  ): void {
    const delay = scheduledTime.getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(() => {
        this.showNotification(title, { body, tag });
      }, delay);
    }
  }

  /**
   * Gets notification statistics
   */
  public getNotificationStats(): {
    permission: NotificationPermission;
    achievementsQueued: number;
    serviceWorkerReady: boolean;
  } {
    return {
      permission: this.notificationPermission,
      achievementsQueued: this.achievementQueue.length,
      serviceWorkerReady: this.serviceWorkerRegistration !== null
    };
  }

  /**
   * Clears achievement queue
   */
  public clearAchievementQueue(): void {
    this.achievementQueue = [];
  }
}

/**
 * Achievement interface for mobile app
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'general' | 'speed' | 'accuracy' | 'streak' | 'milestone';
}

// Global singleton instance for mobile app
export const mobileNotificationService = new MobileNotificationService(); 