import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppLayout } from '../AppLayout';

// Mock the components
jest.mock('../../ui/SettingsIcon', () => ({
  SettingsIcon: () => <div data-testid="mock-settings">Mock Settings</div>
}));

jest.mock('../../navigation/AdvancedEndgameMenu', () => ({
  AdvancedEndgameMenu: () => <div data-testid="mock-menu">Mock Menu</div>
}));

jest.mock('../../ui/DarkModeToggle', () => ({
  DarkModeToggle: () => <div data-testid="mock-dark-toggle">Mock Toggle</div>
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>
}));

describe('AppLayout', () => {
  test('should render children content', () => {
    render(
      <AppLayout>
        <div data-testid="child-content">Test Content</div>
      </AppLayout>
    );
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('should render navigation menu', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );
    
    expect(screen.getByTestId('mock-menu')).toBeInTheDocument();
  });

  test('should apply correct layout classes', () => {
    const { container } = render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );
    
    const layoutDiv = container.firstChild;
    expect(layoutDiv).toHaveClass('min-h-screen');
    expect(layoutDiv).toHaveStyle('background-color: var(--bg-primary)');
  });
  
  test('should render header with title', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );
    
    expect(screen.getByText('Endgame Training')).toBeInTheDocument();
    expect(screen.getByTestId('mock-settings')).toBeInTheDocument();
  });

  test('should render main content area', () => {
    render(
      <AppLayout>
        <div>Main Content</div>
      </AppLayout>
    );
    
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('container', 'mx-auto', 'p-4');
  });

  test('should render multiple children', () => {
    render(
      <AppLayout>
        <div>First Child</div>
        <div>Second Child</div>
        <div>Third Child</div>
      </AppLayout>
    );
    
    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByText('Third Child')).toBeInTheDocument();
  });

  test('should handle empty children', () => {
    const { container } = render(<AppLayout />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  test('should preserve child component props', () => {
    const ChildComponent = ({ id, className }: { id: string; className: string }) => (
      <div id={id} className={className}>Child</div>
    );
    
    render(
      <AppLayout>
        <ChildComponent id="test-id" className="test-class" />
      </AppLayout>
    );
    
    const child = screen.getByText('Child');
    expect(child).toHaveAttribute('id', 'test-id');
    expect(child).toHaveClass('test-class');
  });
});