import type { Metadata } from "next";
import "./globals.css";
import React from "react";

export const metadata: Metadata = {
  title: "PlanPal | GenAI Event Planning Assistant",
  description:
    "AI-driven event planning assistant for weddings, birthdays, and community events. Intelligent budget calculators, milestone timelines, vendor checklists, and creative concept generators."
};

/**
 * Root application layout establishing HTML structure, accessibility skip links,
 * and global CSS variables.
 */
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
