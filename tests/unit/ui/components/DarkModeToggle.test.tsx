import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import component using relative path
import { DarkModeToggle } from '../../../../shared/components/ui/DarkModeToggle';

describe('DarkModeToggle', () => {
  it('sollte den Dark Mode Toggle korrekt rendern', () => {
    render(<DarkModeToggle />);
    
    const toggle = screen.getByLabelText('Dark mode active');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveClass('relative', 'w-14', 'h-8', 'rounded-full');
  });

  it('sollte das Mond-Icon im aktiven Zustand anzeigen', () => {
    render(<DarkModeToggle />);
    
    expect(screen.getAllByText('🌙')).toHaveLength(2); // One in toggle circle, one in background
  });

  it('sollte die korrekte Gradient-Klasse haben', () => {
    render(<DarkModeToggle />);
    
    const toggle = screen.getByLabelText('Dark mode active');
    expect(toggle).toHaveClass('bg-gradient-to-r', 'from-purple-600', 'to-blue-600');
  });

  it('sollte den Toggle-Circle korrekt positionieren', () => {
    const { container } = render(<DarkModeToggle />);
    
    const toggleCircle = container.querySelector('.translate-x-7');
    expect(toggleCircle).toBeInTheDocument();
    expect(toggleCircle).toHaveClass('w-6', 'h-6', 'bg-white', 'rounded-full');
  });

  it('sollte custom className korrekt anwenden', () => {
    render(<DarkModeToggle className="custom-class" />);
    
    const toggle = screen.getByLabelText('Dark mode active');
    expect(toggle).toHaveClass('custom-class');
  });

  it('sollte Background-Icons korrekt rendern', () => {
    const { container } = render(<DarkModeToggle />);
    
    // Sonne sollte opacity-0 haben (ausgeblendet)
    const sunIcon = container.querySelector('.opacity-0');
    expect(sunIcon).toHaveTextContent('☀️');
    
    // Mond sollte opacity-100 haben (sichtbar)
    const moonIcon = container.querySelector('.opacity-100');
    expect(moonIcon).toHaveTextContent('🌙');
  });
});