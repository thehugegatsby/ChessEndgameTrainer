import React from 'react';
import { render, screen } from '@testing-library/react';
import { EvaluationLegend } from '../EvaluationLegend';

describe('EvaluationLegend', () => {
  test('renders all evaluation categories', () => {
    render(<EvaluationLegend />);
    
    // Check title
    expect(screen.getByText('Evaluation Legend')).toBeInTheDocument();
    
    // Check all categories
    expect(screen.getByText('Good Move')).toBeInTheDocument();
    expect(screen.getByText('Okay Move')).toBeInTheDocument();
    expect(screen.getByText('Inaccuracy')).toBeInTheDocument();
    expect(screen.getByText('Mistake')).toBeInTheDocument();
    expect(screen.getByText('Blunder')).toBeInTheDocument();
    expect(screen.getByText('Critical Error')).toBeInTheDocument();
  });

  test('renders evaluation indicators with correct styles', () => {
    const { container } = render(<EvaluationLegend />);
    
    // Check indicators have correct classes
    const goodIndicator = container.querySelector('.bg-green-500');
    expect(goodIndicator).toBeInTheDocument();
    
    const okayIndicator = container.querySelector('.bg-blue-500');
    expect(okayIndicator).toBeInTheDocument();
    
    const inaccuracyIndicator = container.querySelector('.bg-yellow-500');
    expect(inaccuracyIndicator).toBeInTheDocument();
    
    const mistakeIndicator = container.querySelector('.bg-orange-500');
    expect(mistakeIndicator).toBeInTheDocument();
    
    const blunderIndicator = container.querySelector('.bg-red-500');
    expect(blunderIndicator).toBeInTheDocument();
    
    const criticalIndicator = container.querySelector('.bg-purple-500');
    expect(criticalIndicator).toBeInTheDocument();
  });

  test('renders descriptions for each category', () => {
    render(<EvaluationLegend />);
    
    // Check descriptions
    expect(screen.getByText('Maintains or improves position')).toBeInTheDocument();
    expect(screen.getByText('Playable but not optimal')).toBeInTheDocument();
    expect(screen.getByText('Small positional concession')).toBeInTheDocument();
    expect(screen.getByText('Clear disadvantage')).toBeInTheDocument();
    expect(screen.getByText('Severe material/positional loss')).toBeInTheDocument();
    expect(screen.getByText('Game-losing move')).toBeInTheDocument();
  });

  test('has proper layout structure', () => {
    const { container } = render(<EvaluationLegend />);
    
    // Check main container
    const mainContainer = container.querySelector('.bg-gray-50');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('p-4', 'rounded-lg');
    
    // Check grid layout
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-2', 'gap-3');
  });

  test('applies dark mode styles', () => {
    const { container } = render(<EvaluationLegend />);
    
    const mainContainer = container.querySelector('.bg-gray-50');
    expect(mainContainer).toHaveClass('dark:bg-gray-800');
    
    const title = screen.getByText('Evaluation Legend');
    expect(title).toHaveClass('dark:text-gray-300');
  });

  test('renders correct number of evaluation items', () => {
    const { container } = render(<EvaluationLegend />);
    
    const evaluationItems = container.querySelectorAll('.flex.items-center.space-x-2');
    expect(evaluationItems).toHaveLength(6); // 6 evaluation categories
  });

  test('each evaluation item has indicator and label', () => {
    const { container } = render(<EvaluationLegend />);
    
    const evaluationItems = container.querySelectorAll('.flex.items-center.space-x-2');
    
    evaluationItems.forEach(item => {
      // Each item should have an indicator (div with w-4 h-4)
      const indicator = item.querySelector('.w-4.h-4.rounded');
      expect(indicator).toBeInTheDocument();
      
      // Each item should have text content
      const textContent = item.querySelector('.text-sm');
      expect(textContent).toBeInTheDocument();
    });
  });
});