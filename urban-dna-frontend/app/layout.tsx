import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Urban DNA Sequencer — Morphological AI for African Cities",
  description:
    "AI-powered platform that decodes the genetic structure of cities using satellite building data. Detect informal settlements, plan infrastructure, and track urban growth across Africa.",
  keywords: ["urban planning", "informal settlements", "satellite data", "AI", "Africa", "Kigali", "GIS"],
  openGraph: {
    title: "Urban DNA Sequencer",
    description: "Morphological AI for African Cities",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
