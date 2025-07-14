/**
 * @fileoverview Tests for ErrorService
 * @description Comprehensive test coverage for centralized error handling
 */

import { ErrorService, ErrorType, ErrorContext } from '../../../shared/services/errorService';

describe('ErrorService', () => {
  let service: ErrorService;
  let consoleErrorSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Get fresh instance and clear any previous errors
    service = ErrorService.getInstance();
    service.clearErrorLog();
    
    // Mock console.error to suppress output during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  
  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ErrorService.getInstance();
      const instance2 = ErrorService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('handleChessEngineError', () => {
    it('should handle chess engine errors with context', () => {
      const error = new Error('Engine initialization failed');
      const context: ErrorContext = {
        component: 'EngineLoader',
        action: 'initialize'
      };
      
      const message = ErrorService.handleChessEngineError(error, context);
      
      expect(message).toBe('Die Schach-Engine konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR [ErrorService] Chess Engine Error')
      );
    });
    
    it('should handle chess engine errors without context', () => {
      const error = new Error('Worker crashed');
      
      const message = ErrorService.handleChessEngineError(error);
      
      expect(message).toBe('Die Schach-Engine konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR [ErrorService] Chess Engine Error')
      );
    });
  });
  
  describe('handleUIError', () => {
    it('should handle UI errors with component name', () => {
      const error = new Error('Failed to render board');
      const componentName = 'ChessBoard';
      const context: ErrorContext = {
        action: 'render',
        user: 'user123'
      };
      
      const message = ErrorService.handleUIError(error, componentName, context);
      
      expect(message).toBe('Ein Problem mit der Benutzeroberfläche ist aufgetreten. Bitte versuchen Sie es erneut.');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR [ErrorService] UI Error in ChessBoard')
      );
    });
    
    it('should handle UI errors without additional context', () => {
      const error = new Error('State update failed');
      const componentName = 'GameController';
      
      const message = ErrorService.handleUIError(error, componentName);
      
      expect(message).toBe('Ein Problem mit der Benutzeroberfläche ist aufgetreten. Bitte versuchen Sie es erneut.');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR [ErrorService] UI Error in GameController')
      );
    });
  });
  
  describe('handleNetworkError', () => {
    it('should handle network errors with context', () => {
      const error = new Error('Request timeout');
      const context: ErrorContext = {
        action: 'fetchPositions',
        additionalData: {
          url: '/api/positions',
          method: 'GET'
        }
      };
      
      const message = ErrorService.handleNetworkError(error, context);
      
      expect(message).toBe('Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR [ErrorService] Network Error')
      );
    });
    
    it('should handle network errors without context', () => {
      const error = new Error('Connection refused');
      
      const message = ErrorService.handleNetworkError(error);
      
      expect(message).toBe('Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.');
    });
  });
  
  describe('Error Logging', () => {
    it('should maintain error log with maximum 50 entries', () => {
      // Add 60 errors
      for (let i = 0; i < 60; i++) {
        const error = new Error(`Error ${i}`);
        ErrorService.handleChessEngineError(error);
      }
      
      const stats = service.getErrorStats();
      expect(stats.totalErrors).toBe(50);
    });
    
    it('should track errors by type', () => {
      // Add various types of errors
      ErrorService.handleChessEngineError(new Error('Engine error 1'));
      ErrorService.handleChessEngineError(new Error('Engine error 2'));
      ErrorService.handleUIError(new Error('UI error'), 'TestComponent');
      ErrorService.handleNetworkError(new Error('Network error'));
      
      const stats = service.getErrorStats();
      
      expect(stats.totalErrors).toBe(4);
      expect(stats.errorsByType).toEqual({
        CHESS_ENGINE: 2,
        UI_COMPONENT: 1,
        NETWORK: 1
      });
    });
  });
  
  describe('getErrorStats', () => {
    it('should return error statistics', () => {
      // Add some errors
      ErrorService.handleChessEngineError(new Error('Error 1'), { component: 'Engine' });
      ErrorService.handleUIError(new Error('Error 2'), 'Board');
      ErrorService.handleNetworkError(new Error('Error 3'));
      
      const stats = service.getErrorStats();
      
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType).toHaveProperty('CHESS_ENGINE', 1);
      expect(stats.errorsByType).toHaveProperty('UI_COMPONENT', 1);
      expect(stats.errorsByType).toHaveProperty('NETWORK', 1);
      expect(stats.recentErrors).toHaveLength(3);
      expect(stats.recentErrors[0]).toMatchObject({
        type: ErrorType.CHESS_ENGINE,
        component: 'Engine',
        message: 'Error 1'
      });
    });
    
    it('should return empty stats when no errors', () => {
      const stats = service.getErrorStats();
      
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByType).toEqual({});
      expect(stats.recentErrors).toHaveLength(0);
    });
    
    it('should show only last 5 recent errors', () => {
      // Add 10 errors
      for (let i = 0; i < 10; i++) {
        ErrorService.handleChessEngineError(new Error(`Error ${i}`));
      }
      
      const stats = service.getErrorStats();
      
      expect(stats.recentErrors).toHaveLength(5);
      expect(stats.recentErrors[0].message).toBe('Error 5');
      expect(stats.recentErrors[4].message).toBe('Error 9');
    });
  });
  
  describe('clearErrorLog', () => {
    it('should clear all errors', () => {
      // Add some errors
      ErrorService.handleChessEngineError(new Error('Error 1'));
      ErrorService.handleUIError(new Error('Error 2'), 'Component');
      
      let stats = service.getErrorStats();
      expect(stats.totalErrors).toBe(2);
      
      // Clear errors
      service.clearErrorLog();
      
      stats = service.getErrorStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByType).toEqual({});
      expect(stats.recentErrors).toHaveLength(0);
    });
  });
  
  describe('User-Friendly Messages', () => {
    it('should provide appropriate message for each error type', () => {
      // Test all error types
      const testCases = [
        {
          type: ErrorType.CHESS_ENGINE,
          handler: ErrorService.handleChessEngineError,
          expectedMessage: 'Die Schach-Engine konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.'
        },
        {
          type: ErrorType.NETWORK,
          handler: ErrorService.handleNetworkError,
          expectedMessage: 'Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.'
        }
      ];
      
      testCases.forEach(({ handler, expectedMessage }) => {
        const message = handler(new Error('Test error'));
        expect(message).toBe(expectedMessage);
      });
      
      // Test UI error separately due to different signature
      const uiMessage = ErrorService.handleUIError(new Error('UI error'), 'Component');
      expect(uiMessage).toBe('Ein Problem mit der Benutzeroberfläche ist aufgetreten. Bitte versuchen Sie es erneut.');
    });
    
    it('should handle STORAGE and VALIDATION error types', () => {
      // We need to test the private getUserFriendlyMessage method indirectly
      // by creating a custom error handler that sets specific error types
      
      // For STORAGE errors
      const storageError = new Error('Storage error');
      
      // Use reflection to access private method (for testing only)
      const serviceInstance = ErrorService.getInstance();
      const getUserFriendlyMessage = (serviceInstance as any).getUserFriendlyMessage.bind(serviceInstance);
      
      const storageMessage = getUserFriendlyMessage(ErrorType.STORAGE, storageError);
      expect(storageMessage).toBe('Fehler beim Speichern der Daten. Bitte versuchen Sie es erneut.');
      
      // For VALIDATION errors
      const validationMessage = getUserFriendlyMessage(ErrorType.VALIDATION, new Error('Validation error'));
      expect(validationMessage).toBe('Ungültige Eingabe. Bitte überprüfen Sie Ihre Eingaben.');
      
      // For unknown error type
      const unknownMessage = getUserFriendlyMessage('UNKNOWN' as ErrorType, new Error('Unknown error'));
      expect(unknownMessage).toBe('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    });
  });
  
  describe('Error Context', () => {
    it('should preserve all context fields', () => {
      const error = new Error('Complex error');
      const context: ErrorContext = {
        component: 'TestComponent',
        action: 'testAction',
        user: 'testUser',
        timestamp: new Date('2024-01-01'),
        type: ErrorType.VALIDATION,
        additionalData: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
          move: 'e4'
        }
      };
      
      ErrorService.handleChessEngineError(error, context);
      
      const stats = service.getErrorStats();
      const recentError = stats.recentErrors[0];
      
      expect(recentError.component).toBe('TestComponent');
      // Note: type gets overridden by handleChessEngineError
      expect(recentError.type).toBe(ErrorType.CHESS_ENGINE);
    });
  });
});