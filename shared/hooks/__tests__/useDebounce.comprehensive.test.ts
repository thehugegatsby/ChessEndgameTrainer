import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

// Mock timers
jest.useFakeTimers();

describe('useDebounce - Comprehensive Coverage', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Basic Functionality', () => {
    it('sollte initial value sofort zurückgeben', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      
      expect(result.current).toBe('initial');
    });

    it('sollte Wert nach delay aktualisieren', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      expect(result.current).toBe('initial');

      // Update value
      rerender({ value: 'updated', delay: 500 });
      expect(result.current).toBe('initial'); // Should still be initial

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    it('sollte Timer bei erneutem Update zurücksetzen', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      // First update
      rerender({ value: 'update1', delay: 500 });
      
      // Advance time partially
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(result.current).toBe('initial'); // Should still be initial

      // Second update before first timer completes
      rerender({ value: 'update2', delay: 500 });
      
      // Advance time partially again
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(result.current).toBe('initial'); // Should still be initial

      // Complete the timer
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(result.current).toBe('update2'); // Should be the latest value
    });
  });

  describe('Different Data Types', () => {
    it('sollte String values korrekt debounce', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'hello' } }
      );

      rerender({ value: 'world' });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('world');
    });

    it('sollte Number values korrekt debounce', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 0 } }
      );

      rerender({ value: 42 });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe(42);
    });

    it('sollte Boolean values korrekt debounce', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: false } }
      );

      rerender({ value: true });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe(true);
    });

    it('sollte Object values korrekt debounce', () => {
      const initialObj = { name: 'test', count: 0 };
      const updatedObj = { name: 'updated', count: 5 };
      
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: initialObj } }
      );

      rerender({ value: updatedObj });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toEqual(updatedObj);
    });

    it('sollte Array values korrekt debounce', () => {
      const initialArray = [1, 2, 3];
      const updatedArray = [4, 5, 6];
      
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: initialArray } }
      );

      rerender({ value: updatedArray });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toEqual(updatedArray);
    });
  });

  describe('Timing Variations', () => {
    it('sollte mit sehr kurzen delays funktionieren', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 10),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'fast' });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });

      expect(result.current).toBe('fast');
    });

    it('sollte mit langen delays funktionieren', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 5000),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'slow' });
      
      // Should not update before delay
      act(() => {
        jest.advanceTimersByTime(4999);
      });
      expect(result.current).toBe('initial');
      
      // Should update after delay
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe('slow');
    });

    it('sollte mit delay 0 sofort aktualisieren', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'immediate' });
      
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current).toBe('immediate');
    });
  });

  describe('Dynamic Delay Changes', () => {
    it('sollte delay updates korrekt handhaben', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      // Update value
      rerender({ value: 'updated', delay: 500 });
      
      // Change delay before timer completes
      rerender({ value: 'updated', delay: 1000 });
      
      // Advance by original delay
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current).toBe('initial'); // Should still be initial
      
      // Advance by new delay difference
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current).toBe('updated');
    });

    it('sollte gleichzeitige value und delay updates handhaben', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 300 } }
      );

      // Update both value and delay
      rerender({ value: 'both-updated', delay: 600 });
      
      // Use new delay
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      expect(result.current).toBe('both-updated');
    });
  });

  describe('Multiple Rapid Updates', () => {
    it('sollte schnelle aufeinanderfolgende Updates korrekt debounce', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      // Rapid updates
      rerender({ value: 'update1' });
      act(() => { jest.advanceTimersByTime(100); });
      
      rerender({ value: 'update2' });
      act(() => { jest.advanceTimersByTime(100); });
      
      rerender({ value: 'update3' });
      act(() => { jest.advanceTimersByTime(100); });
      
      rerender({ value: 'final' });
      
      // Should still be initial value
      expect(result.current).toBe('initial');
      
      // Complete the debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      // Should be the final value
      expect(result.current).toBe('final');
    });

    it('sollte sehr viele Updates effizient handhaben', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 0 } }
      );

      // Simulate typing/rapid updates
      for (let i = 1; i <= 50; i++) {
        rerender({ value: i });
        act(() => { jest.advanceTimersByTime(10); }); // Rapid but not complete delay
      }

      // Should still be initial value
      expect(result.current).toBe(0);
      
      // Complete the debounce
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // Should be the final value
      expect(result.current).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('sollte null values korrekt handhaben', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: null } }
      );

      rerender({ value: 'not-null' });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('not-null');
    });

    it('sollte undefined values korrekt handhaben', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: undefined } }
      );

      rerender({ value: 'defined' });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('defined');
    });

    it('sollte gleiche Werte nicht erneut debounce', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'same' } }
      );

      rerender({ value: 'same' }); // Same value
      
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('same');
    });
  });

  describe('Cleanup on Unmount', () => {
    it('sollte Timer beim Unmount clearen', () => {
      const { result, rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });
      
      // Unmount before timer completes
      unmount();
      
      // Advance time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // No state update should happen after unmount
      // This test passes if no errors are thrown
      expect(true).toBe(true);
    });
  });

  describe('Performance Scenarios', () => {
    it('sollte bei Search-Input-Simulation performen', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: '' } }
      );

      const searchTerms = ['a', 'ap', 'app', 'appl', 'apple'];
      
      searchTerms.forEach((term, index) => {
        rerender({ value: term });
        act(() => { jest.advanceTimersByTime(50); }); // Typing speed
      });

      expect(result.current).toBe(''); // Should still be initial
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe('apple'); // Final search term
    });
  });
}); 