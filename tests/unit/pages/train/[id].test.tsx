import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TrainingPage from '../../../../pages/train/[id]';
import { positionService } from '@shared/services/database/positionService';
import { mockRouter } from '../../../../__mocks__/next/router';

// Mock dependencies
jest.mock('@shared/services/database/positionService');
jest.mock('@shared/pages/TrainingPageZustand', () => ({
  TrainingPageZustand: ({ position }: { position: any }) => (
    <div data-testid="training-page">{position.name}</div>
  ),
}));

const mockPositionService = positionService as jest.Mocked<typeof positionService>;

describe('TrainingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockRouter to default state
    mockRouter.isReady = true;
    mockRouter.query = { id: '1' };
    mockRouter.push = jest.fn();
  });

  it('should show loading state initially', () => {
    mockPositionService.getPosition.mockImplementation(() => new Promise(() => {}));
    
    render(<TrainingPage />);
    
    expect(screen.getByText('Loading training position...')).toBeInTheDocument();
  });

  it('should load and display position from positionService', async () => {
    const mockPosition = {
      id: 1,
      name: 'Opposition Grundlagen',
      fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
    };
    
    mockPositionService.getPosition.mockResolvedValue(mockPosition as any);
    
    render(<TrainingPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('training-page')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Opposition Grundlagen')).toBeInTheDocument();
    expect(mockPositionService.getPosition).toHaveBeenCalledWith(1);
  });

  it('should redirect to 404 when position not found', async () => {
    mockPositionService.getPosition.mockResolvedValue(null);
    
    render(<TrainingPage />);
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/404');
    });
  });

  it('should show error state when loading fails', async () => {
    mockPositionService.getPosition.mockRejectedValue(new Error('Network error'));
    
    render(<TrainingPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load training position. Please try again.')).toBeInTheDocument();
    });
  });

  it('should handle invalid position ID', async () => {
    mockRouter.query = { id: 'invalid' };
    
    render(<TrainingPage />);
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/404');
    });
    
    expect(mockPositionService.getPosition).not.toHaveBeenCalled();
  });
});