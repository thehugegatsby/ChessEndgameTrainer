// shared/lib/chess/evaluation/__tests__/pipeline.isolated.test.ts

import './jest.setup'; // Setup mocks
import { EvaluationPipelineFactory } from '../pipelineFactory';
// Assuming 'chess.js' is used for game state representation.
import { Chess } from 'chess.js';

describe('EvaluationPipeline (Isolated)', () => {
  let pipeline: ReturnType<typeof EvaluationPipelineFactory.createDefault>;

  beforeEach(() => {
    // Initialize a new pipeline instance before each test.
    pipeline = EvaluationPipelineFactory.createDefault();
  });

  it('should return a neutral evaluation for the starting position', () => {
    const evaluation = {
      score: 0,
      mate: null,
      depth: 20
    };
    
    const formatted = pipeline.formatEngineEvaluation(evaluation, 'w');

    // For the starting position with score 0, expect neutral formatting
    expect(formatted.className).toBe('neutral');
    expect(formatted.mainText).toBe('0.0');
  });

  it('should handle mate evaluations correctly', () => {
    const evaluation = {
      score: 0,
      mate: 3,
      depth: 20
    };
    
    const formatted = pipeline.formatEngineEvaluation(evaluation, 'w');

    expect(formatted.className).toBe('winning');
    expect(formatted.mainText).toBe('M3');
  });

  // TODO: Add more tests for specific positions:
  // - A position where one side has a clear material advantage.
  // - A position testing perspective handling.
  // - A position testing tablebase evaluation formatting.
});