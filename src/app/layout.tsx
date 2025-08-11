import React from "react";
import "../styles/globals.css";
import { AppProviders } from "./providers";

/**
 * Metadata configuration for the Next.js application
 * @constant
 * @type {import('next').Metadata}
 */
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
}): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
