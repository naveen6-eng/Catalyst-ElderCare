import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareCircle — Elderly Care & Medication Management",
  description: "Accessible medication tracking, care circles, and appointment management for seniors and families.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-elder-bg text-elder-text selection:bg-elder-accent selection:text-elder-bg">
        {children}
      </body>
    </html>
  );
}
