import { GetStaticPropsContext } from 'next';
import { getStaticProps, getStaticPaths } from '../../../../pages/train/[id]';
import { positionService } from '@shared/services/database/positionService';
import { EndgamePosition } from '@shared/types';

// Mock the positionService
jest.mock('@shared/services/database/positionService');

const mockPositionService = positionService as jest.Mocked<typeof positionService>;

/**
 * Tests for Next.js SSG data fetching functions
 * These test the server-side logic that runs at build time
 */
describe('TrainingPage SSG Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('getStaticProps', () => {
    const createContext = (id: string): GetStaticPropsContext => ({
      params: { id },
      locales: undefined,
      locale: undefined,
      defaultLocale: undefined,
    });

    it('should fetch and return position data for valid ID', async () => {
      const mockPosition: EndgamePosition = {
        id: 1,
        name: 'Opposition Grundlagen',
        fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
        category: 'basic',
        difficulty: 'beginner',
        description: 'Learn the basics of opposition',
        requiredMoves: 4,
        allowedMoves: 6,
        hint: 'Keep the opposition',
        solution: 'Ke5',
        targetSquares: ['e5'],
        order: 1
      };

      mockPositionService.getPosition.mockResolvedValue(mockPosition);

      const result = await getStaticProps(createContext('1'));

      expect(mockPositionService.getPosition).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        props: {
          position: mockPosition
        },
        revalidate: 86400 // 24 hours
      });
    });

    it('should return notFound for non-existent position', async () => {
      mockPositionService.getPosition.mockResolvedValue(null);

      const result = await getStaticProps(createContext('999'));

      expect(mockPositionService.getPosition).toHaveBeenCalledWith(999);
      expect(result).toEqual({ notFound: true });
    });

    it('should return notFound for invalid ID format', async () => {
      const result = await getStaticProps(createContext('invalid'));

      expect(mockPositionService.getPosition).not.toHaveBeenCalled();
      expect(result).toEqual({ notFound: true });
    });

    it('should return notFound when params are missing', async () => {
      const context: GetStaticPropsContext = {
        params: undefined,
        locales: undefined,
        locale: undefined,
        defaultLocale: undefined,
      };

      const result = await getStaticProps(context);

      expect(mockPositionService.getPosition).not.toHaveBeenCalled();
      expect(result).toEqual({ notFound: true });
    });

    it('should handle service errors gracefully', async () => {
      mockPositionService.getPosition.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await getStaticProps(createContext('1'));

      expect(mockPositionService.getPosition).toHaveBeenCalledWith(1);
      expect(result).toEqual({ notFound: true });
      expect(console.error).toHaveBeenCalledWith(
        'Error loading position in getStaticProps:',
        expect.any(Error)
      );
    });

    it('should handle different position IDs correctly', async () => {
      const positions: EndgamePosition[] = [
        {
          id: 5,
          name: 'Pawn Endgame',
          fen: '8/8/8/8/4P3/8/8/8 w - - 0 1',
          category: 'pawn',
          difficulty: 'intermediate',
          description: 'Pawn promotion technique',
          requiredMoves: 3,
          allowedMoves: 5,
          hint: 'Push to promote',
          solution: 'e5',
          targetSquares: ['e8'],
          order: 5
        },
        {
          id: 13,
          name: 'Queen vs Pawn',
          fen: 'Q7/8/8/8/8/2p5/8/2K5 w - - 0 1',
          category: 'queen',
          difficulty: 'advanced',
          description: 'Stop the pawn',
          requiredMoves: 6,
          allowedMoves: 8,
          hint: 'Control key squares',
          solution: 'Qa1',
          targetSquares: ['c1'],
          order: 13
        }
      ];

      for (const position of positions) {
        mockPositionService.getPosition.mockResolvedValue(position);

        const result = await getStaticProps(createContext(position.id.toString()));

        expect(result).toEqual({
          props: { position },
          revalidate: 86400
        });
      }
    });
  });

  describe('getStaticPaths', () => {
    it('should generate paths for the first 13 positions', async () => {
      const result = await getStaticPaths({});

      expect(result.paths).toHaveLength(13);
      expect(result.fallback).toBe(true);

      // Verify paths structure
      result.paths.forEach((path, index) => {
        expect(path).toEqual({
          params: { id: (index + 1).toString() }
        });
      });
    });

    it('should enable ISR with fallback true', async () => {
      const result = await getStaticPaths({});

      expect(result.fallback).toBe(true);
    });

    it('should return consistent paths on multiple calls', async () => {
      const result1 = await getStaticPaths({});
      const result2 = await getStaticPaths({});

      expect(result1).toEqual(result2);
    });
  });
});