import React from 'react';
import '../styles/globals.css';
import { PositionServiceProvider } from '@shared/contexts/PositionServiceContext';
import { AppProviders } from './providers';

export const metadata = {
  title: 'Chess Endgame Trainer',
  description: 'Advanced chess endgame training with AI analysis',
};

// Server-side initialization handled in providers
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <PositionServiceProvider>
            {children}
          </PositionServiceProvider>
        </AppProviders>
      </body>
    </html>
  );
}