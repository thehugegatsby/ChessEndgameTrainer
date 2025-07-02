import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DarkModeToggle } from './DarkModeToggle';

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

  it('sollte korrekte ARIA-Attribute haben', () => {
    render(<DarkModeToggle />);
    
    const toggle = screen.getByLabelText('Dark mode active');
    expect(toggle).toHaveAttribute('aria-label', 'Dark mode active');
  });

  it('sollte mit leerer className funktionieren', () => {
    render(<DarkModeToggle className="" />);
    
    const toggle = screen.getByLabelText('Dark mode active');
    expect(toggle).toBeInTheDocument();
  });

  it('sollte ohne className prop funktionieren', () => {
    render(<DarkModeToggle />);
    
    const toggle = screen.getByLabelText('Dark mode active');
    expect(toggle).toBeInTheDocument();
  });

  describe('Visual Structure', () => {
    it('sollte die korrekte DOM-Struktur haben', () => {
      const { container } = render(<DarkModeToggle />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children).toHaveLength(2); // Toggle circle + background icons
    });

    it('sollte den Toggle-Circle mit Mond-Icon haben', () => {
      const { container } = render(<DarkModeToggle />);
      
      const toggleCircle = container.querySelector('.translate-x-7');
      expect(toggleCircle).toHaveTextContent('🌙');
      expect(toggleCircle).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('sollte Background-Container mit beiden Icons haben', () => {
      const { container } = render(<DarkModeToggle />);
      
      const backgroundContainer = container.querySelector('.absolute.inset-0.flex');
      expect(backgroundContainer).toBeInTheDocument();
      expect(backgroundContainer).toHaveClass('items-center', 'justify-between', 'px-2');
    });
  });

  describe('Styling', () => {
    it('sollte korrekte Text-Größen haben', () => {
      const { container } = render(<DarkModeToggle />);
      
      // Toggle circle icon
      const circleIcon = container.querySelector('.translate-x-7 span');
      expect(circleIcon).toHaveClass('text-xs');
      
      // Background icons container should have text-xs class
      const backgroundContainer = container.querySelector('.absolute.inset-0.flex');
      expect(backgroundContainer).toHaveClass('text-xs');
    });

    it('sollte Shadow-Effekt auf Toggle-Circle haben', () => {
      const { container } = render(<DarkModeToggle />);
      
      const toggleCircle = container.querySelector('.translate-x-7');
      expect(toggleCircle).toHaveClass('shadow-lg');
    });

    it('sollte weiße Farbe für Background-Icons haben', () => {
      const { container } = render(<DarkModeToggle />);
      
      const backgroundContainer = container.querySelector('.absolute.inset-0.flex');
      expect(backgroundContainer).toHaveClass('text-white');
    });
  });
}); 