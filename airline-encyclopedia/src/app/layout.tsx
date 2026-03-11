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
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--color-border)]">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-[var(--color-primary)] tracking-tight">
                  SkyAtlas
                </span>
                <span className="hidden sm:inline text-sm text-[var(--color-muted)] ml-2">
                  Airlines Encyclopedia
                </span>
              </div>
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              All Airlines
            </Link>
          </nav>
        </header>
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-[var(--color-border)] bg-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-[var(--color-muted)]">
            SkyAtlas — Commercial Airlines Encyclopedia. Data is
            representative and may not reflect real-time fleet or route
            information.
          </div>
        </footer>
      </body>
    </html>
  );
}
