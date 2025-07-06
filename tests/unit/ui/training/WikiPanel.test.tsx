import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import component using relative path
import { WikiPanel } from '../../../../shared/components/training/WikiPanel';

describe('WikiPanel', () => {
  test('renders WikiPanel component', () => {
    render(<WikiPanel />);
    
    expect(screen.getByText('Bauernendspiel: Opposition')).toBeInTheDocument();
  });

  test('has correct container styling', () => {
    const { container } = render(<WikiPanel />);
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('space-y-4');
    expect(mainDiv).toHaveClass('h-full');
    expect(mainDiv).toHaveClass('overflow-y-auto');
  });
});