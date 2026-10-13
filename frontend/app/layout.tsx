import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haven — Companion Chat",
  description: "Next.js 15 frontend for the Haven AI companion backend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
