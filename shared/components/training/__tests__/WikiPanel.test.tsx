import React from 'react';
import { render, screen } from '@testing-library/react';
import { WikiPanel } from '../WikiPanel';

describe('WikiPanel', () => {
  test('renders WikiPanel component', () => {
    render(<WikiPanel />);
    
    expect(screen.getByText('Wiki Content Coming Soon')).toBeInTheDocument();
  });

  test('has correct container styling', () => {
    const { container } = render(<WikiPanel />);
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('p-4');
  });
});