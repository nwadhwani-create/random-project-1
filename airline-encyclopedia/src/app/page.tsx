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
      <section className="relative bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#1e40af] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Commercial Airlines
            <br />
            <span className="text-blue-300">Encyclopedia</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl leading-relaxed">
            Explore the world&apos;s major airlines. Discover their histories,
            fleets, and global route networks through interactive maps and
            detailed profiles.
          </p>
          <div className="mt-8 flex flex-wrap gap-8 text-sm">
            <div>
              <div className="text-3xl font-bold">{airlines.length}</div>
              <div className="text-blue-200">Airlines</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {totalFleet.toLocaleString()}
              </div>
              <div className="text-blue-200">Aircraft</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {totalRoutes.toLocaleString()}+
              </div>
              <div className="text-blue-200">Routes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-[var(--color-border)] p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                Search Airlines
              </label>
              <input
                type="text"
                placeholder="Name, country, or IATA code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                Alliance
              </label>
              <select
                value={alliance}
                onChange={(e) => setAlliance(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition"
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
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition"
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
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
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
                  className="airline-card block bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm"
                >
                  <div
                    className="h-2"
                    style={{ backgroundColor: airline.logoColor }}
                  />
                  <div className="p-6">
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
                        className="text-xs font-bold px-2.5 py-1 rounded-md"
                        style={{
                          backgroundColor: airline.logoColor + "15",
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
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
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
                        <span className="inline-block text-xs font-medium px-2.5 py-1 bg-[var(--color-surface-alt)] text-[var(--color-muted)] rounded-full">
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
