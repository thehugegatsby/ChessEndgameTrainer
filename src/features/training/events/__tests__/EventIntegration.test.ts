/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { trainingEvents } from '../EventEmitter';
import { EventBasedMoveDialogManager } from '../EventBasedMoveDialogManager';

describe('Event Integration Tests', () => {
  let manager: EventBasedMoveDialogManager;
  
  beforeEach(() => {
    manager = new EventBasedMoveDialogManager();
    // Clear any existing handlers
    trainingEvents.clear();
  });
  
  afterEach(() => {
    trainingEvents.clear();
  });
  
  describe('EventBasedMoveDialogManager', () => {
    it('should emit move:feedback event for errors', async () => {
      const promise = new Promise<void>((resolve) => {
        // Subscribe to event
        trainingEvents.on('move:feedback', (data) => {
          expect(data).toEqual({
            type: 'error',
            wasOptimal: false,
            wdlBefore: 50,
            wdlAfter: -50,
            bestMove: 'Qe5',
            playedMove: 'Qd4'
          });
          resolve();
        });
      });
      
      // Trigger error dialog
      manager.showMoveErrorDialog(50, -50, 'Qe5', 'Qd4', 10);
      
      await promise;
    });
    
    it('should emit move:feedback event for success', async () => {
      const promise = new Promise<void>((resolve) => {
        // Subscribe to event
        trainingEvents.on('move:feedback', (data) => {
          expect(data).toEqual({
            type: 'success',
            wasOptimal: true
          });
          resolve();
        });
      });
      
      // Trigger success dialog
      manager.showMoveSuccessDialog('Great move!', 'Q');
      
      await promise;
    });
    
    it('should emit promotion:required event', async () => {
      const promise = new Promise<void>((resolve) => {
        // Subscribe to event
        trainingEvents.on('promotion:required', (data) => {
          expect(data).toEqual({
            from: 'e7',
            to: 'e8',
            color: 'w'
          });
          resolve();
        });
      });
      
      // Request promotion
      manager.requestPromotion('e7', 'e8', 'w');
      
      await promise;
    });
    
    it('should format WDL changes correctly', () => {
      expect(manager.formatWdlChange(50, 75)).toBe('+25.0%');
      expect(manager.formatWdlChange(50, 25)).toBe('-25.0%');
      expect(manager.formatWdlChange(0, 0)).toBe('+0.0%');
    });
    
    it('should determine feedback severity correctly', () => {
      expect(manager.getFeedbackSeverity(100, 40)).toBe('error'); // -60
      expect(manager.getFeedbackSeverity(50, 20)).toBe('warning'); // -30
      expect(manager.getFeedbackSeverity(50, 60)).toBe('success'); // +10
    });
  });
  
  describe('Feature Flag Integration', () => {
    it.skip('should store and retrieve feature flag from localStorage', () => {
      // Set feature flag
      const flagData = { eventDrivenTraining: true };
      localStorage.setItem('featureFlags', JSON.stringify(flagData));
      
      // Verify the localStorage is set correctly
      const stored = localStorage.getItem('featureFlags');
      expect(stored).toBeDefined();
      
      const flags = JSON.parse(stored!);
      expect(flags.eventDrivenTraining).toBe(true);
      
      localStorage.removeItem('featureFlags');
    });
    
    it('should parse URL params correctly', () => {
      // Create URL params
      const params = new URLSearchParams('?eventDriven=true&other=value');
      
      expect(params.get('eventDriven')).toBe('true');
      expect(params.has('eventDriven')).toBe(true);
    });
  });
  
  describe('Event Flow Simulation', () => {
    it('should handle complete move flow with events', async () => {
      const events: any[] = [];
      
      // Subscribe to all events
      trainingEvents.on('move:attempted', (data) => {
        events.push({ type: 'attempted', data });
      });
      
      trainingEvents.on('move:validated', (data) => {
        events.push({ type: 'validated', data });
      });
      
      trainingEvents.on('move:applied', (data) => {
        events.push({ type: 'applied', data });
      });
      
      trainingEvents.on('move:feedback', (data) => {
        events.push({ type: 'feedback', data });
      });
      
      // Simulate move flow
      trainingEvents.emit('move:attempted', { from: 'e2', to: 'e4' });
      trainingEvents.emit('move:validated', { isValid: true });
      trainingEvents.emit('move:applied', { 
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        san: 'e4',
        moveNumber: 1
      });
      trainingEvents.emit('move:feedback', { 
        type: 'success',
        wasOptimal: true
      });
      
      // Verify all events were captured
      expect(events).toHaveLength(4);
      expect(events[0].type).toBe('attempted');
      expect(events[1].type).toBe('validated');
      expect(events[2].type).toBe('applied');
      expect(events[3].type).toBe('feedback');
    });
  });
});