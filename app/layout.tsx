import React from "react";
import "../styles/globals.css";
import { PositionServiceProvider } from "@shared/contexts/PositionServiceContext";
import { AppProviders } from "./providers";

/**
 * Metadata configuration for the Next.js application
 * @constant
 * @type {import('next').Metadata}
 */
// eslint-disable-next-line jsdoc/require-jsdoc
export const metadata = {
  title: "Chess Endgame Trainer",
  description: "Advanced chess endgame training with AI analysis",
};

/**
 * Root layout component
 * @param props - Component props
 * @param props.children - Child components to render
 * @returns Root layout with providers
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <PositionServiceProvider>{children}</PositionServiceProvider>
        </AppProviders>
      </body>
    </html>
  );
}
