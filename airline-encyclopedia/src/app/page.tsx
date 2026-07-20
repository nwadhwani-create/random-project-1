"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { airlines } from "@/data/airlines";

const alliances = ["All", "Star Alliance", "Oneworld", "SkyTeam", "None"];
const regions = [
  "All",
  "North America",
  "Europe",
  "Middle East",
  "Asia-Pacific",
  "Africa",
  "South America",
  "Oceania",
];

const regionMap: Record<string, string> = {
  "United States": "North America",
  "United Kingdom": "Europe",
  Germany: "Europe",
  France: "Europe",
  Turkey: "Europe",
  "United Arab Emirates": "Middle East",
  Qatar: "Middle East",
  Singapore: "Asia-Pacific",
  Japan: "Asia-Pacific",
  "South Korea": "Asia-Pacific",
  "Hong Kong": "Asia-Pacific",
  Myanmar: "Asia-Pacific",
  Australia: "Oceania",
  Ethiopia: "Africa",
};

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [alliance, setAlliance] = useState("All");
  const [region, setRegion] = useState("All");

  const filtered = useMemo(() => {
    return airlines.filter((a) => {
      const matchSearch =
        search === "" ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.country.toLowerCase().includes(search.toLowerCase()) ||
        a.iataCode.toLowerCase().includes(search.toLowerCase());
      const matchAlliance =
        alliance === "All" || a.alliance === alliance;
      const matchRegion =
        region === "All" || regionMap[a.country] === region;
      return matchSearch && matchAlliance && matchRegion;
    });
  }, [search, alliance, region]);

  const totalFleet = airlines.reduce(
    (sum, a) => sum + a.fleet.reduce((s, f) => s + f.count, 0),
    0
  );
  const totalRoutes = airlines.reduce((sum, a) => sum + a.routes.length, 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0c1929] via-[#0c4a6e] to-[#0369a1] text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-sky-300/5 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Flight path decorations */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1200 500">
          <path d="M-50,350 Q200,300 400,320 T850,200 T1250,150" stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none" strokeDasharray="8,16" />
          <path d="M-30,400 Q300,350 600,380 T1250,250" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" fill="none" strokeDasharray="6,12" />
          <path d="M1250,100 Q900,80 600,120 T-50,200" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" fill="none" strokeDasharray="4,10" />
          {/* Small airplane icon at end of path */}
          <g transform="translate(845,198) rotate(-15)">
            <path d="M0,0 L8,-3 L2,0 L8,3Z" fill="rgba(255,255,255,0.15)" />
          </g>
          {/* Clouds */}
          <g opacity="0.04" fill="white">
            <ellipse cx="200" cy="80" rx="120" ry="35" />
            <ellipse cx="240" cy="72" rx="80" ry="28" />
            <ellipse cx="900" cy="120" rx="90" ry="25" />
            <ellipse cx="930" cy="115" rx="60" ry="20" />
          </g>
        </svg>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-sky-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-sky-300/80 tracking-wider uppercase">
              Aviation Encyclopedia
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Discover the World&apos;s
            <br />
            <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">
              Airlines &amp; Fleets
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-sky-100/70 max-w-2xl leading-relaxed">
            Explore detailed profiles of major commercial airlines — their
            histories, fleet compositions, and global route networks through
            interactive maps.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <div className="stat-card">
              <div className="text-3xl font-bold text-white">{airlines.length}</div>
              <div className="text-sky-300/70 text-sm mt-0.5">Airlines</div>
            </div>
            <div className="stat-card">
              <div className="text-3xl font-bold text-white">
                {totalFleet.toLocaleString()}
              </div>
              <div className="text-sky-300/70 text-sm mt-0.5">Aircraft</div>
            </div>
            <div className="stat-card">
              <div className="text-3xl font-bold text-white">
                {totalRoutes.toLocaleString()}+
              </div>
              <div className="text-sky-300/70 text-sm mt-0.5">Routes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="glass-card rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                Search Airlines
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Name, country, or IATA code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-xl text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                Alliance
              </label>
              <select
                value={alliance}
                onChange={(e) => setAlliance(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] transition appearance-none"
              >
                {alliances.map((a) => (
                  <option key={a} value={a}>
                    {a === "All" ? "All Alliances" : a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] transition appearance-none"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r === "All" ? "All Regions" : r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Airline Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
            {filtered.length === airlines.length
              ? "All Airlines"
              : `${filtered.length} Airline${filtered.length !== 1 ? "s" : ""} Found`}
          </h2>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--color-muted)]">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-40"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
            <p className="text-lg">No airlines match your filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setAlliance("All");
                setRegion("All");
              }}
              className="mt-4 text-[var(--color-accent)] font-medium hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((airline) => {
              const fleetSize = airline.fleet.reduce(
                (s, f) => s + f.count,
                0
              );
              return (
                <Link
                  key={airline.slug}
                  href={`/airline/${airline.slug}`}
                  className="airline-card block bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm"
                >
                  <div
                    className="h-1.5 rounded-t-2xl"
                    style={{
                      background: `linear-gradient(90deg, ${airline.logoColor}, ${airline.accentColor || airline.logoColor}dd)`,
                    }}
                  />
                  <div className="p-6 relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[var(--color-foreground)]">
                          {airline.name}
                        </h3>
                        <p className="text-sm text-[var(--color-muted)]">
                          {airline.country}
                        </p>
                      </div>
                      <span
                        className="text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{
                          backgroundColor: airline.logoColor + "12",
                          color: airline.logoColor,
                        }}
                      >
                        {airline.iataCode}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 text-xs text-[var(--color-muted)]">
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Est. {airline.founded}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                        </svg>
                        {fleetSize} aircraft
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {airline.routes.length} routes
                      </div>
                    </div>
                    {airline.alliance !== "None" && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                        <span className="inline-block text-xs font-medium px-3 py-1 bg-[var(--color-surface-alt)] text-[var(--color-muted)] rounded-full">
                          {airline.alliance}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
