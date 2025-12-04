import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Word Sync",
  description: "Two-player word matching game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
