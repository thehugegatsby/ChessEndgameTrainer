import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { EvaluationLegend } from '../EvaluationLegend';

describe('EvaluationLegend', () => {
  test('renders collapsed legend button', () => {
    render(<EvaluationLegend />);
    
    // Check for legend button
    expect(screen.getByText('📖 Legende')).toBeInTheDocument();
    
    // Check for expand arrow
    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  test('expands to show legend content when clicked', () => {
    const { container } = render(<EvaluationLegend />);
    
    // Initially no expanded content
    expect(container.querySelector('.mt-2.p-3.rounded')).not.toBeInTheDocument();
    
    // Click the button
    const button = screen.getByText('📖 Legende').closest('button');
    
    act(() => {
      fireEvent.click(button!);
    });
    
    // Now expanded content should be visible
    expect(container.querySelector('.mt-2.p-3.rounded')).toBeInTheDocument();
  });

  test('toggles expand/collapse arrow when clicked', () => {
    render(<EvaluationLegend />);
    
    // Initially shows right arrow
    expect(screen.getByText('▶')).toBeInTheDocument();
    expect(screen.queryByText('▼')).not.toBeInTheDocument();
    
    // Click to expand
    const button = screen.getByText('📖 Legende').closest('button');
    
    act(() => {
      fireEvent.click(button!);
    });
    
    // Now shows down arrow
    expect(screen.getByText('▼')).toBeInTheDocument();
    expect(screen.queryByText('▶')).not.toBeInTheDocument();
  });

  test('has proper layout structure', () => {
    const { container } = render(<EvaluationLegend />);
    
    // Click to expand
    const button = screen.getByText('📖 Legende').closest('button');
    
    act(() => {
      fireEvent.click(button!);
    });
    
    // Check for grid layouts inside legend sections
    const grids = container.querySelectorAll('.grid');
    expect(grids.length).toBeGreaterThan(0);
    
    // Check for gap styling
    grids.forEach(grid => {
      expect(grid).toHaveClass('grid-cols-1', 'gap-1');
    });
  });

  test.skip('applies custom CSS variables for theming', () => {
    // Skip this test as jsdom doesn't properly render inline styles with CSS variables
    const { container } = render(<EvaluationLegend />);
    
    // Check button uses CSS variables
    const button = screen.getByText('📖 Legende').closest('button');
    const buttonStyle = button?.getAttribute('style') || '';
    expect(buttonStyle).toContain('background-color: var(--bg-tertiary)');
    expect(buttonStyle).toContain('color: var(--text-secondary)');
  });

  test('renders evaluation items when expanded', () => {
    const { container } = render(<EvaluationLegend />);
    
    // Click to expand
    const button = screen.getByText('📖 Legende').closest('button');
    
    act(() => {
      fireEvent.click(button!);
    });
    
    // Check for evaluation items (flex items-center gap-2)
    const evaluationItems = container.querySelectorAll('.flex.items-center.gap-2');
    expect(evaluationItems.length).toBeGreaterThan(0); // Should have multiple evaluation symbols
  });

  test('each evaluation item has symbol and description', () => {
    const { container } = render(<EvaluationLegend />);
    
    // Click to expand
    const button = screen.getByText('📖 Legende').closest('button');
    
    act(() => {
      fireEvent.click(button!);
    });
    
    const evaluationItems = container.querySelectorAll('.flex.items-center.gap-2');
    
    evaluationItems.forEach(item => {
      // Each item should have a symbol (span with w-6)
      const symbol = item.querySelector('.w-6.text-center');
      expect(symbol).toBeInTheDocument();
      
      // Each item should have description text
      const spans = item.querySelectorAll('span');
      expect(spans.length).toBeGreaterThanOrEqual(2);
    });
  });
});