/**
 * Unit tests for StranglerFacade component
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { StranglerFacade, createServiceFacade } from '../../shared/components/StranglerFacade';
import { FeatureFlag, featureFlags } from '../../shared/services/FeatureFlagService';

// Mock components for testing
const LegacyComponent = ({ message }: { message: string }): React.ReactElement => (
  <div data-testid="legacy-component">Legacy: {message}</div>
);

const NewComponent = ({ message }: { message: string }): React.ReactElement => (
  <div data-testid="new-component">New: {message}</div>
);

const ErrorComponent = ({ message }: { message: string }): React.ReactElement => {
  throw new Error(`New component error: ${message}`);
};

describe('StranglerFacade', () => {
  beforeEach(() => {
    // Reset all feature flags
    Object.values(FeatureFlag).forEach(flag => {
      featureFlags.override(flag, false);
    });
    
    // Clear console mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    cleanup();
  });
  
  describe('Component Facade', () => {
    it('should render legacy component when flag is disabled', () => {
      render(
        <StranglerFacade
          flag={FeatureFlag.USE_NEW_CHESS_CORE}
          legacyComponent={LegacyComponent}
          newComponent={NewComponent}
          componentProps={{ message: 'Test' }}
        />
      );
      
      expect(screen.getByTestId('legacy-component')).toBeInTheDocument();
      expect(screen.getByText('Legacy: Test')).toBeInTheDocument();
      expect(screen.queryByTestId('new-component')).not.toBeInTheDocument();
    });
    
    it('should render new component when flag is enabled', () => {
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      
      render(
        <StranglerFacade
          flag={FeatureFlag.USE_NEW_CHESS_CORE}
          legacyComponent={LegacyComponent}
          newComponent={NewComponent}
          componentProps={{ message: 'Test' }}
        />
      );
      
      expect(screen.getByTestId('new-component')).toBeInTheDocument();
      expect(screen.getByText('New: Test')).toBeInTheDocument();
      expect(screen.queryByTestId('legacy-component')).not.toBeInTheDocument();
    });
    
    it('should fallback to legacy on error when fallbackToLegacy is true', async () => {
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <StranglerFacade
          flag={FeatureFlag.USE_NEW_CHESS_CORE}
          legacyComponent={LegacyComponent}
          newComponent={ErrorComponent}
          componentProps={{ message: 'Test' }}
          fallbackToLegacy={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('legacy-component')).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('New implementation failed')
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should not render anything on error when fallbackToLegacy is false', () => {
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { container } = render(
        <StranglerFacade
          flag={FeatureFlag.USE_NEW_CHESS_CORE}
          legacyComponent={LegacyComponent}
          newComponent={ErrorComponent}
          componentProps={{ message: 'Test' }}
          fallbackToLegacy={false}
        />
      );
      
      // Should render nothing after error
      expect(container.firstChild).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    it('should switch components when flag changes', () => {
      const { rerender } = render(
        <StranglerFacade
          flag={FeatureFlag.USE_NEW_CHESS_CORE}
          legacyComponent={LegacyComponent}
          newComponent={NewComponent}
          componentProps={{ message: 'Test' }}
        />
      );
      
      expect(screen.getByTestId('legacy-component')).toBeInTheDocument();
      
      // Enable the flag
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      
      rerender(
        <StranglerFacade
          flag={FeatureFlag.USE_NEW_CHESS_CORE}
          legacyComponent={LegacyComponent}
          newComponent={NewComponent}
          componentProps={{ message: 'Test' }}
        />
      );
      
      expect(screen.getByTestId('new-component')).toBeInTheDocument();
      expect(screen.queryByTestId('legacy-component')).not.toBeInTheDocument();
    });
    
    it('should reset error state when switching back to legacy', async () => {
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { rerender } = render(
        <StranglerFacade
          flag={FeatureFlag.USE_NEW_CHESS_CORE}
          legacyComponent={LegacyComponent}
          newComponent={ErrorComponent}
          componentProps={{ message: 'Test' }}
          fallbackToLegacy={true}
        />
      );
      
      // Should fallback to legacy after error
      await waitFor(() => {
        expect(screen.getByTestId('legacy-component')).toBeInTheDocument();
      });
      
      // Disable flag to switch back to legacy normally
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, false);
      
      rerender(
        <StranglerFacade
          flag={FeatureFlag.USE_NEW_CHESS_CORE}
          legacyComponent={LegacyComponent}
          newComponent={NewComponent}
          componentProps={{ message: 'Test Updated' }}
          fallbackToLegacy={true}
        />
      );
      
      expect(screen.getByTestId('legacy-component')).toBeInTheDocument();
      expect(screen.getByText('Legacy: Test Updated')).toBeInTheDocument();
      
      // Re-enable flag with working component
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      
      rerender(
        <StranglerFacade
          flag={FeatureFlag.USE_NEW_CHESS_CORE}
          legacyComponent={LegacyComponent}
          newComponent={NewComponent}
          componentProps={{ message: 'Test Updated' }}
          fallbackToLegacy={true}
        />
      );
      
      // Should now show new component without error
      expect(screen.getByTestId('new-component')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Service Facade', () => {
    // Mock services
    const legacyService = {
      getData: vi.fn(() => 'legacy data'),
      processData: vi.fn((input: string) => `legacy: ${input}`),
      count: 42,
    };
    
    const newService = {
      getData: vi.fn(() => 'new data'),
      processData: vi.fn((input: string) => `new: ${input}`),
      count: 100,
    };
    
    it('should use legacy service when flag is disabled', () => {
      const facade = createServiceFacade(
        FeatureFlag.USE_NEW_TABLEBASE_SERVICE,
        legacyService,
        newService,
        (flag) => featureFlags.isEnabled(flag)
      );
      
      expect(facade.getData()).toBe('legacy data');
      expect(facade.processData('test')).toBe('legacy: test');
      expect(facade.count).toBe(42);
      
      expect(legacyService.getData).toHaveBeenCalled();
      expect(newService.getData).not.toHaveBeenCalled();
    });
    
    it('should use new service when flag is enabled', () => {
      featureFlags.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
      
      const facade = createServiceFacade(
        FeatureFlag.USE_NEW_TABLEBASE_SERVICE,
        legacyService,
        newService,
        (flag) => featureFlags.isEnabled(flag)
      );
      
      expect(facade.getData()).toBe('new data');
      expect(facade.processData('test')).toBe('new: test');
      expect(facade.count).toBe(100);
      
      expect(newService.getData).toHaveBeenCalled();
      expect(legacyService.getData).not.toHaveBeenCalled();
    });
    
    it('should maintain correct this binding for methods', () => {
      const legacyServiceWithThis = {
        value: 'legacy',
        getValue: function() {
          return this.value;
        },
      };
      
      const newServiceWithThis = {
        value: 'new',
        getValue: function() {
          return this.value;
        },
      };
      
      const facade = createServiceFacade(
        FeatureFlag.USE_NEW_TABLEBASE_SERVICE,
        legacyServiceWithThis,
        newServiceWithThis,
        (flag) => featureFlags.isEnabled(flag)
      );
      
      expect(facade.getValue()).toBe('legacy');
      
      featureFlags.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
      
      const newFacade = createServiceFacade(
        FeatureFlag.USE_NEW_TABLEBASE_SERVICE,
        legacyServiceWithThis,
        newServiceWithThis,
        (flag) => featureFlags.isEnabled(flag)
      );
      
      expect(newFacade.getValue()).toBe('new');
    });
    
    it('should handle nested properties', () => {
      const complexLegacyService = {
        config: {
          timeout: 1000,
          retries: 3,
        },
        api: {
          fetch: vi.fn(() => 'legacy fetch'),
        },
      };
      
      const complexNewService = {
        config: {
          timeout: 2000,
          retries: 5,
        },
        api: {
          fetch: vi.fn(() => 'new fetch'),
        },
      };
      
      const facade = createServiceFacade(
        FeatureFlag.USE_NEW_TABLEBASE_SERVICE,
        complexLegacyService,
        complexNewService,
        (flag) => featureFlags.isEnabled(flag)
      );
      
      expect(facade.config.timeout).toBe(1000);
      expect(facade.config.retries).toBe(3);
      expect(facade.api.fetch()).toBe('legacy fetch');
    });
  });
});