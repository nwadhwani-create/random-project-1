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
  title: "SFO Flightboard — Live Arrivals & Departures",
  description:
    "Track arrivals and departures at San Francisco International Airport.",
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
        <header className="site-header">
          <nav className="site-nav">
            <Link href="/" className="brand">
              <div className="brand-mark">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </div>
              <div>
                <strong>SFO Flightboard</strong>
                <span>Bay Area Aviation</span>
              </div>
            </Link>
            <div className="nav-links">
              <Link href="#flights">Flights</Link>
              <Link href="#airport">Airport</Link>
              <a href="https://www.flysfo.com/passengers" target="_blank" rel="noreferrer">Traveler info ↗</a>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
