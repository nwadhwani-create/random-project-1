import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkyAtlas — Commercial Airlines Encyclopedia",
  description:
    "A comprehensive encyclopedia of the world's commercial airlines, featuring fleet details, route maps, and airline histories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-[var(--color-border)]/60">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-sm shadow-sky-500/20">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] bg-clip-text text-transparent tracking-tight">
                  SkyAtlas
                </span>
                <span className="hidden sm:inline text-sm text-[var(--color-muted)] ml-2 font-medium">
                  Airlines Encyclopedia
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface-alt)]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
                Airlines
              </Link>
              <Link
                href="/#popular-airports"
                className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface-alt)]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Airports
              </Link>
            </div>
          </nav>
        </header>
        <main className="min-h-screen relative z-10">{children}</main>
        <footer className="relative z-10 border-t border-[var(--color-border)] bg-gradient-to-b from-white to-[var(--color-surface-alt)] mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
                <span className="font-bold text-[var(--color-primary)]">SkyAtlas</span>
              </div>
              <p className="text-sm text-[var(--color-muted)] text-center">
                Commercial Airlines Encyclopedia. Data is representative and may
                not reflect real-time fleet or route information.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
