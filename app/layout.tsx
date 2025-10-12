import type { Metadata } from "next";
import "./styles/design-system.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Essence - Warm Editorial Design",
  description: "A beautiful, warm editorial experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}