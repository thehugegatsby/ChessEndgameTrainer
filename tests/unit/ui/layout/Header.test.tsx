import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom';
import { Header } from './Header';

describe('Header', () => {
  it('sollte den Header mit korrektem Text rendern', () => {
    render(<Header />);
    
    expect(screen.getByText('Schach Endspiel Training')).toBeInTheDocument();
    expect(screen.getByText('Verbessere dein Endspiel')).toBeInTheDocument();
  });

  it('sollte das Schach-Icon anzeigen', () => {
    render(<Header />);
    
    expect(screen.getByText('♔')).toBeInTheDocument();
  });

  it('sollte als HTML header Element rendern', () => {
    const { container } = render(<Header />);
    
    const headerElement = container.querySelector('header');
    expect(headerElement).toBeInTheDocument();
  });

  it('sollte korrekte CSS Klassen für Fixed Positioning haben', () => {
    const { container } = render(<Header />);
    
    const headerElement = container.querySelector('header');
    expect(headerElement).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50');
  });

  it('sollte responsive Container haben', () => {
    const { container } = render(<Header />);
    
    const containerDiv = container.querySelector('.max-w-7xl');
    expect(containerDiv).toBeInTheDocument();
    expect(containerDiv).toHaveClass('mx-auto', 'px-4', 'py-3');
  });

  it('sollte Flexbox Layout für Header-Inhalt verwenden', () => {
    const { container } = render(<Header />);
    
    const flexContainer = container.querySelector('.flex.items-center.justify-between');
    expect(flexContainer).toBeInTheDocument();
  });

  it('sollte Logo und Title in korrekter Struktur haben', () => {
    render(<Header />);
    
    const title = screen.getByText('Schach Endspiel Training');
    expect(title.tagName).toBe('H1');
    expect(title).toHaveClass('text-xl', 'font-bold');
  });

  it('sollte Tagline mit korrekter Styling haben', () => {
    render(<Header />);
    
    const tagline = screen.getByText('Verbessere dein Endspiel');
    expect(tagline).toHaveClass('text-sm');
  });

  describe('Layout Structure', () => {
    it('sollte Logo und Title zusammen gruppiert haben', () => {
      const { container } = render(<Header />);
      
      const logoTitleGroup = container.querySelector('.flex.items-center.space-x-3');
      expect(logoTitleGroup).toBeInTheDocument();
      
      // Should contain both icon and title
      expect(logoTitleGroup).toHaveTextContent('♔');
      expect(logoTitleGroup).toHaveTextContent('Schach Endspiel Training');
    });

    it('sollte Icon mit korrekter Größe rendern', () => {
      render(<Header />);
      
      const icon = screen.getByText('♔');
      expect(icon).toHaveClass('text-2xl');
    });
  });

  describe('CSS Variables', () => {
    it('sollte CSS Variablen für Farben verwenden', () => {
      render(<Header />);
      
      const title = screen.getByText('Schach Endspiel Training');
      expect(title).toHaveStyle('color: var(--text-primary)');
      
      const tagline = screen.getByText('Verbessere dein Endspiel');
      expect(tagline).toHaveStyle('color: var(--text-secondary)');
    });
  });

  describe('Accessibility', () => {
    it('sollte semantisches header Element verwenden', () => {
      const { container } = render(<Header />);
      
      const headerElement = container.querySelector('header');
      expect(headerElement).toBeInTheDocument();
    });

    it('sollte h1 für den Haupttitel verwenden', () => {
      render(<Header />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Schach Endspiel Training');
    });

    it('sollte lesbare Texte für Screenreader haben', () => {
      render(<Header />);
      
      expect(screen.getByText('Schach Endspiel Training')).toBeInTheDocument();
      expect(screen.getByText('Verbessere dein Endspiel')).toBeInTheDocument();
    });
  });
}); 