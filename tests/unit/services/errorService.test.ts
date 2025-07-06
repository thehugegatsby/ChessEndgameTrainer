import { ErrorService, ErrorType } from '@/services/errorService';

describe('ErrorService - Comprehensive Coverage', () => {
  let errorService: ErrorService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    errorService = ErrorService.getInstance();
    errorService.clearErrorLog();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Singleton Pattern', () => {
    it('sollte dieselbe Instanz zurückgeben', () => {
      const instance1 = ErrorService.getInstance();
      const instance2 = ErrorService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Chess Engine Error Handling', () => {
    it('sollte Chess Engine Error korrekt handhaben', () => {
      const testError = new Error('Engine failed');
      const context = { component: 'TrainingBoard', action: 'evaluate' };

      const message = ErrorService.handleChessEngineError(testError, context);

      expect(consoleSpy).toHaveBeenCalledWith('🚨 Chess Engine Error:', expect.objectContaining({
        message: 'Engine failed',
        stack: expect.any(String),
        context: expect.objectContaining({
          type: ErrorType.CHESS_ENGINE,
          component: 'TrainingBoard',
          action: 'evaluate',
          timestamp: expect.any(Date)
        })
      }));

      expect(message).toBe('Die Schach-Engine konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.');
    });

    it('sollte Chess Engine Error ohne context handhaben', () => {
      const testError = new Error('Simple engine error');
      
      const message = ErrorService.handleChessEngineError(testError);

      expect(consoleSpy).toHaveBeenCalled();
      expect(message).toBe('Die Schach-Engine konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.');
    });
  });

  describe('UI Error Handling', () => {
    it('sollte UI Component Error korrekt handhaben', () => {
      const testError = new Error('Component render failed');
      const componentName = 'TrainingControls';
      const context = { action: 'render', user: 'test-user' };

      const message = ErrorService.handleUIError(testError, componentName, context);

      expect(consoleSpy).toHaveBeenCalledWith(`🚨 UI Error in ${componentName}:`, expect.objectContaining({
        message: 'Component render failed',
        context: expect.objectContaining({
          component: componentName,
          type: ErrorType.UI_COMPONENT,
          action: 'render',
          user: 'test-user',
          timestamp: expect.any(Date)
        })
      }));

      expect(message).toBe('Ein Problem mit der Benutzeroberfläche ist aufgetreten. Bitte versuchen Sie es erneut.');
    });
  });

  describe('Network Error Handling', () => {
    it('sollte Network Error korrekt handhaben', () => {
      const testError = new Error('Network timeout');
      const context = { action: 'fetch-positions', additionalData: { url: '/api/positions' } };

      const message = ErrorService.handleNetworkError(testError, context);

      expect(consoleSpy).toHaveBeenCalledWith('🚨 Network Error:', expect.objectContaining({
        message: 'Network timeout',
        context: expect.objectContaining({
          type: ErrorType.NETWORK,
          action: 'fetch-positions',
          additionalData: { url: '/api/positions' },
          timestamp: expect.any(Date)
        })
      }));

      expect(message).toBe('Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.');
    });
  });

  describe('Error Statistics', () => {
    it('sollte Error Stats korrekt verfolgen', () => {
      // Generate different types of errors
      ErrorService.handleChessEngineError(new Error('Engine 1'));
      ErrorService.handleChessEngineError(new Error('Engine 2'));
      ErrorService.handleUIError(new Error('UI 1'), 'Component1');
      ErrorService.handleNetworkError(new Error('Network 1'));

      const stats = errorService.getErrorStats();

      expect(stats.totalErrors).toBe(4);
      expect(stats.errorsByType).toEqual({
        CHESS_ENGINE: 2,
        UI_COMPONENT: 1,
        NETWORK: 1
      });
      expect(stats.recentErrors).toHaveLength(4);
    });

    it('sollte nur die letzten 5 Errors in recentErrors zeigen', () => {
      // Generate 7 errors
      for (let i = 1; i <= 7; i++) {
        ErrorService.handleChessEngineError(new Error(`Error ${i}`));
      }

      const stats = errorService.getErrorStats();
      expect(stats.recentErrors).toHaveLength(5);
      expect(stats.recentErrors[4].message).toBe('Error 7'); // Latest should be last
    });

    it('sollte Error Log begrenzen auf 50 Einträge', () => {
      // Generate 60 errors
      for (let i = 1; i <= 60; i++) {
        ErrorService.handleChessEngineError(new Error(`Error ${i}`));
      }

      const stats = errorService.getErrorStats();
      expect(stats.totalErrors).toBe(50); // Should be capped at 50
    });
  });

  describe('User-Friendly Messages', () => {
    it('sollte Storage Error Message zurückgeben', () => {
      const errorService = ErrorService.getInstance();
      // Access private method for testing
      const message = (errorService as any).getUserFriendlyMessage(ErrorType.STORAGE, new Error());
      expect(message).toBe('Fehler beim Speichern der Daten. Bitte versuchen Sie es erneut.');
    });

    it('sollte Validation Error Message zurückgeben', () => {
      const errorService = ErrorService.getInstance();
      const message = (errorService as any).getUserFriendlyMessage(ErrorType.VALIDATION, new Error());
      expect(message).toBe('Ungültige Eingabe. Bitte überprüfen Sie Ihre Eingaben.');
    });

    it('sollte Default Error Message für unknown types zurückgeben', () => {
      const errorService = ErrorService.getInstance();
      const message = (errorService as any).getUserFriendlyMessage('UNKNOWN' as ErrorType, new Error());
      expect(message).toBe('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    });
  });

  describe('Error Log Management', () => {
    it('sollte Error Log clearen können', () => {
      ErrorService.handleChessEngineError(new Error('Test'));
      ErrorService.handleUIError(new Error('Test'), 'Component');

      let stats = errorService.getErrorStats();
      expect(stats.totalErrors).toBe(2);

      errorService.clearErrorLog();

      stats = errorService.getErrorStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByType).toEqual({});
      expect(stats.recentErrors).toHaveLength(0);
    });
  });

  describe('Error Context Handling', () => {
    it('sollte zusätzliche Daten in Context speichern', () => {
      const testError = new Error('Context test');
      const context = {
        component: 'TestComponent',
        action: 'test-action',
        user: 'test-user',
        additionalData: {
          position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          moveCount: 5
        }
      };

      ErrorService.handleChessEngineError(testError, context);

      const stats = errorService.getErrorStats();
      expect(stats.recentErrors[0]).toEqual({
        type: ErrorType.CHESS_ENGINE,
        component: 'TestComponent',
        timestamp: expect.any(Date),
        message: 'Context test'
      });
    });

    it('sollte timestamps korrekt setzen', () => {
      const beforeTime = new Date();
      ErrorService.handleChessEngineError(new Error('Timestamp test'));
      const afterTime = new Date();

      const stats = errorService.getErrorStats();
      const errorTimestamp = stats.recentErrors[0].timestamp;

      expect(errorTimestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(errorTimestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});