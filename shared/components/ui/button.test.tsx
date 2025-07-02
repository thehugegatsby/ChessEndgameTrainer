import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('sollte einen Button mit dem übergebenen Text rendern', () => {
    render(<Button>Klick mich</Button>);
    expect(screen.getByRole('button', { name: /klick mich/i })).toBeInTheDocument();
  });
}); 