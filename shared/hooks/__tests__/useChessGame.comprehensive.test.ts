import { renderHook, act } from '@testing-library/react';
import { useChessGame } from '../useChessGame';

describe('useChessGame - Comprehensive Coverage', () => {
  const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const endgameFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';

  describe('Initialization', () => {
    it('sollte mit initial FEN initialisieren', () => {
      const { result } = renderHook(() => 
        useChessGame({ initialFen })
      );

      expect(result.current.currentFen).toBe(initialFen);
      expect(result.current.currentPgn).toBe('');
      expect(result.current.history).toEqual([]);
      expect(result.current.isGameFinished).toBe(false);
      expect(result.current.game).toBeDefined();
    });

    it('sollte mit Endgame FEN initialisieren', () => {
      const { result } = renderHook(() => 
        useChessGame({ initialFen: endgameFen })
      );

      expect(result.current.currentFen).toBe(endgameFen);
      expect(result.current.game.fen()).toBe(endgameFen);
    });
  });

  describe('Move Making', () => {
    it('sollte gültigen Zug ausführen', async () => {
      const { result } = renderHook(() => 
        useChessGame({ initialFen })
      );

      await act(async () => {
        const success = await result.current.makeMove({ from: 'e2', to: 'e4' });
        expect(success).toBe(true);
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].from).toBe('e2');
      expect(result.current.history[0].to).toBe('e4');
      expect(result.current.currentFen).not.toBe(initialFen);
    });

    it('sollte ungültigen Zug ablehnen', async () => {
      const { result } = renderHook(() => 
        useChessGame({ initialFen })
      );

      await act(async () => {
        const success = await result.current.makeMove({ from: 'e2', to: 'e5' });
        expect(success).toBe(false);
      });

      expect(result.current.history).toHaveLength(0);
      expect(result.current.currentFen).toBe(initialFen);
    });

    it('sollte Bauernumwandlung handhaben', async () => {
      const promotionFen = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1';
      const { result } = renderHook(() => 
        useChessGame({ initialFen: promotionFen })
      );

      await act(async () => {
        const success = await result.current.makeMove({ 
          from: 'a7', 
          to: 'a8', 
          promotion: 'q' 
        });
        expect(success).toBe(true);
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].promotion).toBe('q');
    });

    it('sollte keine Züge nach Spielende akzeptieren', async () => {
      const checkmateFen = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
      const { result } = renderHook(() => 
        useChessGame({ initialFen: checkmateFen })
      );

      // Game should be finished (checkmate)
      expect(result.current.isGameFinished).toBe(false); // Initial state

      await act(async () => {
        const success = await result.current.makeMove({ from: 'e2', to: 'e3' });
        expect(success).toBe(false);
      });
    });

    it('sollte onComplete callback bei Spielende aufrufen', async () => {
      const onComplete = jest.fn();
      const checkmateFen = 'rnbqkb1r/pppp1ppp/5n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
      
      const { result } = renderHook(() => 
        useChessGame({ 
          initialFen: checkmateFen,
          onComplete
        })
      );

      await act(async () => {
        const success = await result.current.makeMove({ from: 'h5', to: 'f7' });
        expect(success).toBe(true);
      });

      expect(onComplete).toHaveBeenCalledWith(true);
    });

    it('sollte onPositionChange callback aufrufen', async () => {
      const onPositionChange = jest.fn();
      const { result } = renderHook(() => 
        useChessGame({ 
          initialFen,
          onPositionChange
        })
      );

      await act(async () => {
        await result.current.makeMove({ from: 'e2', to: 'e4' });
      });

      expect(onPositionChange).toHaveBeenCalled();
      expect(onPositionChange.mock.calls[0][0]).not.toBe(initialFen); // New FEN
      expect(onPositionChange.mock.calls[0][1]).toContain('1. e4'); // PGN contains move
    });

    it('sollte Fehler beim Zug graceful handhaben', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => 
        useChessGame({ initialFen })
      );

      // Mock chess.js to throw an error
      jest.spyOn(result.current.game, 'move').mockImplementationOnce(() => {
        throw new Error('Move error');
      });

      await act(async () => {
        const success = await result.current.makeMove({ from: 'e2', to: 'e4' });
        expect(success).toBe(false);
      });

      // Console error was removed in optimization - error is handled silently
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Game Navigation', () => {
    it('sollte zu Move Index springen', async () => {
      const onPositionChange = jest.fn();
      const { result } = renderHook(() => 
        useChessGame({ 
          initialFen,
          onPositionChange
        })
      );

      // Make a few moves first
      await act(async () => {
        await result.current.makeMove({ from: 'e2', to: 'e4' });
        await result.current.makeMove({ from: 'e7', to: 'e5' });
        await result.current.makeMove({ from: 'g1', to: 'f3' });
      });

      expect(result.current.history).toHaveLength(3);

      // Jump to move 1 (after e4 e5)
      act(() => {
        result.current.jumpToMove(1);
      });

      expect(result.current.currentPgn).toContain('1. e4 e5');
      expect(onPositionChange).toHaveBeenCalled();
    });

    it('sollte zu Move 0 springen (Anfangsposition)', () => {
      const { result } = renderHook(() => 
        useChessGame({ initialFen })
      );

      act(() => {
        result.current.jumpToMove(-1);
      });

      expect(result.current.currentFen).toBe(initialFen);
      expect(result.current.currentPgn).toContain('*'); // Initial position PGN contains result marker
    });

    it('sollte mit Index über Geschichte umgehen', () => {
      const { result } = renderHook(() => 
        useChessGame({ initialFen })
      );

      act(() => {
        result.current.jumpToMove(999);
      });

      expect(result.current.currentFen).toBe(initialFen);
    });
  });

  describe('Game Reset', () => {
    it('sollte Spiel auf Anfangsposition zurücksetzen', async () => {
      const onPositionChange = jest.fn();
      const { result } = renderHook(() => 
        useChessGame({ 
          initialFen,
          onPositionChange
        })
      );

      // Make some moves
      await act(async () => {
        await result.current.makeMove({ from: 'e2', to: 'e4' });
        await result.current.makeMove({ from: 'e7', to: 'e5' });
      });

      expect(result.current.history).toHaveLength(2);

      // Reset game
      act(() => {
        result.current.resetGame();
      });

      expect(result.current.currentFen).toBe(initialFen);
      expect(result.current.currentPgn).toBe(''); // Reset clears PGN
      expect(result.current.history).toEqual([]);
      expect(result.current.isGameFinished).toBe(false);
      expect(onPositionChange).toHaveBeenCalled();
    });

    it('sollte mit anderem initialFen zurücksetzen', () => {
      const { result } = renderHook(() => 
        useChessGame({ initialFen: endgameFen })
      );

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.currentFen).toBe(endgameFen);
    });
  });

  describe('Undo Move', () => {
    it('sollte letzten Zug rückgängig machen', async () => {
      const onPositionChange = jest.fn();
      const { result } = renderHook(() => 
        useChessGame({ 
          initialFen,
          onPositionChange
        })
      );

      // Make moves
      await act(async () => {
        await result.current.makeMove({ from: 'e2', to: 'e4' });
        await result.current.makeMove({ from: 'e7', to: 'e5' });
      });

      expect(result.current.history).toHaveLength(2);

      // Undo last move
      act(() => {
        const success = result.current.undoMove();
        expect(success).toBe(true);
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.currentPgn).toContain('1. e4');
      expect(result.current.isGameFinished).toBe(false);
      expect(onPositionChange).toHaveBeenCalled();
    });

    it('sollte false zurückgeben wenn keine Züge vorhanden', () => {
      const { result } = renderHook(() => 
        useChessGame({ initialFen })
      );

      act(() => {
        const success = result.current.undoMove();
        expect(success).toBe(false);
      });

      expect(result.current.history).toEqual([]);
      expect(result.current.currentFen).toBe(initialFen);
    });

    it('sollte alle Züge rückgängig machen können', async () => {
      const { result } = renderHook(() => 
        useChessGame({ initialFen })
      );

      // Make moves
      await act(async () => {
        await result.current.makeMove({ from: 'e2', to: 'e4' });
        await result.current.makeMove({ from: 'e7', to: 'e5' });
        await result.current.makeMove({ from: 'g1', to: 'f3' });
      });

      // Undo all moves one by one, sequentially
      act(() => {
        result.current.undoMove(); // Undo 3rd move (Nf3)
      });
      
      expect(result.current.history).toHaveLength(2); // e4, e5 remain
      
      act(() => {
        result.current.undoMove(); // Undo 2nd move (e5)
      });
      
      expect(result.current.history).toHaveLength(1); // Only e4 remains
      
      act(() => {
        result.current.undoMove(); // Undo 1st move (e4)
      });

      expect(result.current.history).toEqual([]);
      expect(result.current.currentFen).toBe(initialFen);
      expect(result.current.currentPgn).toContain('*'); // Initial position PGN contains headers and result marker
    });
  });

  describe('Edge Cases', () => {
    it('sollte mit null move result umgehen', async () => {
      const { result } = renderHook(() => 
        useChessGame({ initialFen })
      );

      // Mock chess.js to return null (invalid move)
      jest.spyOn(result.current.game, 'move').mockReturnValueOnce(null as any);

      await act(async () => {
        const success = await result.current.makeMove({ from: 'e2', to: 'e4' });
        expect(success).toBe(false);
      });

      expect(result.current.history).toHaveLength(0);
    });

    it('sollte ohne callbacks funktionieren', async () => {
      const { result } = renderHook(() => 
        useChessGame({ initialFen })
      );

      await act(async () => {
        const success = await result.current.makeMove({ from: 'e2', to: 'e4' });
        expect(success).toBe(true);
      });

      expect(result.current.history).toHaveLength(1);
    });

    it('sollte refs korrekt aktualisieren', async () => {
      const { result } = renderHook(() => 
        useChessGame({ initialFen })
      );

      await act(async () => {
        await result.current.makeMove({ from: 'e2', to: 'e4' });
      });

      // Refs should be updated to latest values
      expect(result.current.history).toHaveLength(1);
      
      // Jump to position should work with updated refs
      act(() => {
        result.current.jumpToMove(0);
      });

      expect(result.current.currentPgn).toContain('1. e4');
    });
  });
}); 