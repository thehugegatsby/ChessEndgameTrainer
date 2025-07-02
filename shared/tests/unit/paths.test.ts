import { Engine } from '@shared/lib/chess/engine';
import { TrainingBoard } from '@shared/components/training/TrainingBoard';

describe('Path Aliases', () => {
  it('should resolve @shared imports correctly', () => {
    // Test Engine import
    expect(Engine).toBeDefined();
    expect(typeof Engine.getInstance).toBe('function');

    // Test TrainingBoard import
    expect(TrainingBoard).toBeDefined();
    expect(typeof TrainingBoard).toBe('function');
  });
}); 