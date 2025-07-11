import React from 'react';
import { render, screen } from '@testing-library/react';
import TrainingPage, { getStaticProps, getStaticPaths } from '../../../../pages/train/[id]';
import { positionService } from '@shared/services/database/positionService';
import { mockRouter } from '../../../../__mocks__/next/router';
import { GetStaticPropsContext } from 'next';

// Mock dependencies
jest.mock('@shared/services/database/positionService');
jest.mock('@shared/pages/TrainingPageZustand', () => ({
  TrainingPageZustand: ({ position }: { position: any }) => (
    <div data-testid="training-page">{position.name}</div>
  ),
}));

const mockPositionService = positionService as jest.Mocked<typeof positionService>;

describe('TrainingPage ISR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.isFallback = false;
  });

  describe('Component', () => {
    it('should show loading state when router.isFallback is true', () => {
      mockRouter.isFallback = true;
      
      render(<TrainingPage position={null} />);
      
      expect(screen.getByText('Loading training position...')).toBeInTheDocument();
    });

    it('should render position when provided', () => {
      const mockPosition = {
        id: 1,
        name: 'Opposition Grundlagen',
        fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
      };
      
      render(<TrainingPage position={mockPosition as any} />);
      
      expect(screen.getByTestId('training-page')).toBeInTheDocument();
      expect(screen.getByText('Opposition Grundlagen')).toBeInTheDocument();
    });

    it('should show not found message when position is null and not fallback', () => {
      mockRouter.isFallback = false;
      
      render(<TrainingPage position={null} />);
      
      expect(screen.getByText('Position not found')).toBeInTheDocument();
    });
  });

  describe('getStaticPaths', () => {
    it('should return paths for popular positions with fallback true', async () => {
      const result = await getStaticPaths({});
      
      expect(result.paths).toHaveLength(13); // Math.min(20, 13)
      expect(result.paths[0]).toEqual({ params: { id: '1' } });
      expect(result.paths[12]).toEqual({ params: { id: '13' } });
      expect(result.fallback).toBe(true);
    });
  });

  describe('getStaticProps', () => {
    it('should return position data when found', async () => {
      const mockPosition = {
        id: 1,
        name: 'Opposition Grundlagen',
        fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
      };
      
      mockPositionService.getPosition.mockResolvedValue(mockPosition as any);
      
      const context: GetStaticPropsContext = {
        params: { id: '1' },
      };
      
      const result = await getStaticProps(context);
      
      expect(mockPositionService.getPosition).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        props: { position: mockPosition },
        revalidate: 86400,
      });
    });

    it('should return notFound when position not found', async () => {
      mockPositionService.getPosition.mockResolvedValue(null);
      
      const context: GetStaticPropsContext = {
        params: { id: '999' },
      };
      
      const result = await getStaticProps(context);
      
      expect(result).toEqual({ notFound: true });
    });

    it('should return notFound for invalid ID', async () => {
      const context: GetStaticPropsContext = {
        params: { id: 'invalid' },
      };
      
      const result = await getStaticProps(context);
      
      expect(result).toEqual({ notFound: true });
      expect(mockPositionService.getPosition).not.toHaveBeenCalled();
    });

    it('should return notFound when params missing', async () => {
      const context: GetStaticPropsContext = {
        params: undefined,
      };
      
      const result = await getStaticProps(context);
      
      expect(result).toEqual({ notFound: true });
    });

    it('should handle errors and return notFound', async () => {
      mockPositionService.getPosition.mockRejectedValue(new Error('Network error'));
      
      const context: GetStaticPropsContext = {
        params: { id: '1' },
      };
      
      const result = await getStaticProps(context);
      
      expect(result).toEqual({ notFound: true });
    });
  });
});