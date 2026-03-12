"use client";

import { useState, useMemo } from "react";
import { popularAirports, regionColors, regions } from "@/data/popularAirports";

const PAGE_SIZE = 10;

export default function PopularAirports() {
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    return popularAirports.filter((airport) => {
      const matchRegion =
        selectedRegion === "All" || airport.region === selectedRegion;
      const matchSearch =
        searchQuery === "" ||
        airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        airport.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        airport.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        airport.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRegion && matchSearch;
    });
  }, [selectedRegion, searchQuery]);

  const displayed = showAll ? filtered : filtered.slice(0, PAGE_SIZE);

  const totalPassengers = popularAirports.reduce(
    (sum, a) => sum + a.passengers,
    0
  );
  const avgChange =
    popularAirports.reduce((sum, a) => sum + a.change, 0) /
    popularAirports.length;
  const totalCountries = new Set(popularAirports.map((a) => a.country)).size;

  return (
    <section className="relative overflow-hidden" id="popular-airports">
      {/* Section header with gradient background */}
      <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0c4a6e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl transform -translate-x-1/3 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/2" />
        </div>

        {/* Globe grid decoration */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 1200 400"
        >
          <ellipse
            cx="600"
            cy="200"
            rx="280"
            ry="140"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            fill="none"
          />
          <ellipse
            cx="600"
            cy="200"
            rx="220"
            ry="110"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
            fill="none"
          />
          <ellipse
            cx="600"
            cy="200"
            rx="140"
            ry="70"
            stroke="rgba(255,255,255,0.02)"
            strokeWidth="1"
            fill="none"
          />
          <line
            x1="320"
            y1="200"
            x2="880"
            y2="200"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <line
            x1="600"
            y1="60"
            x2="600"
            y2="340"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          {popularAirports.slice(0, 8).map((airport, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const cx = 600 + Math.cos(angle) * 220;
            const cy = 200 + Math.sin(angle) * 100;
            return (
              <circle
                key={airport.code}
                cx={cx}
                cy={cy}
                r="3"
                fill="rgba(56,189,248,0.4)"
              />
            );
          })}
        </svg>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-sky-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-sky-300/80 tracking-wider uppercase">
              Global Airport Rankings
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
            World&apos;s Most Popular
            <br />
            <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">
              Airports
            </span>
          </h2>
          <p className="mt-4 text-lg text-sky-100/70 max-w-2xl leading-relaxed">
            Ranked by annual passenger traffic using publicly available data.
            Discover the busiest aviation hubs connecting people across the
            globe.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="stat-card">
              <div className="text-3xl font-bold text-white">
                {popularAirports.length}
              </div>
              <div className="text-sky-300/70 text-sm mt-0.5">
                Top Airports
              </div>
            </div>
            <div className="stat-card">
              <div className="text-3xl font-bold text-white">
                {totalPassengers.toFixed(1)}M
              </div>
              <div className="text-sky-300/70 text-sm mt-0.5">
                Combined Passengers
              </div>
            </div>
            <div className="stat-card">
              <div className="text-3xl font-bold text-white">
                {totalCountries}
              </div>
              <div className="text-sky-300/70 text-sm mt-0.5">Countries</div>
            </div>
            <div className="stat-card">
              <div className="text-3xl font-bold text-white">
                +{avgChange.toFixed(1)}%
              </div>
              <div className="text-sky-300/70 text-sm mt-0.5">Avg. Growth</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="glass-card rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                Search Airports
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Airport name, city, country, or IATA code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-xl text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
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
      </div>

      {/* Airport ranking list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top 3 podium */}
        {selectedRegion === "All" && searchQuery === "" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {popularAirports.slice(0, 3).map((airport) => {
              const colors =
                regionColors[airport.region] || regionColors["North America"];
              return (
                <div
                  key={airport.code}
                  className="airport-podium-card relative bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm"
                >
                  <div
                    className="h-2 rounded-t-2xl"
                    style={{
                      background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}99)`,
                    }}
                  />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                        }}
                      >
                        #{airport.rank}
                      </div>
                      <span
                        className="text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                        }}
                      >
                        {airport.code}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--color-foreground)] leading-tight">
                      {airport.name}
                    </h3>
                    <p className="text-sm text-[var(--color-muted)] mt-1">
                      {airport.city}, {airport.country}
                    </p>
                    {airport.highlight && (
                      <p
                        className="text-xs font-medium mt-3 px-3 py-1.5 rounded-lg inline-block"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                        }}
                      >
                        {airport.highlight}
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-[var(--color-foreground)]">
                          {airport.passengers}M
                        </span>
                        <span className="text-sm text-[var(--color-muted)]">
                          passengers/year
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-[var(--color-muted)]">
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                          </svg>
                          {airport.airlinesCount} airlines
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {airport.countriesConnected} countries
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                          <span className="text-emerald-600 font-medium">
                            +{airport.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ranking table */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="font-bold text-[var(--color-foreground)]">
              {selectedRegion === "All" ? "Full Rankings" : `${selectedRegion} Rankings`}
              <span className="text-sm font-normal text-[var(--color-muted)] ml-2">
                ({filtered.length} airport{filtered.length !== 1 ? "s" : ""})
              </span>
            </h3>
            <span className="text-xs text-[var(--color-muted)]">
              Based on {popularAirports[0]?.yearData} passenger data
            </span>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-[var(--color-surface-alt)] text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b border-[var(--color-border)]">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Airport</div>
            <div className="col-span-2">Region</div>
            <div className="col-span-2 text-right">Passengers</div>
            <div className="col-span-1 text-right">Airlines</div>
            <div className="col-span-1 text-right">Countries</div>
            <div className="col-span-1 text-right">Growth</div>
          </div>

          {/* Table rows */}
          {displayed.length === 0 ? (
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
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg">No airports match your filters.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedRegion("All");
                }}
                className="mt-4 text-[var(--color-accent)] font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            displayed.map((airport) => {
              const colors =
                regionColors[airport.region] || regionColors["North America"];
              return (
                <div
                  key={airport.code}
                  className="airport-row grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-6 py-4 border-b border-[var(--color-border)] last:border-b-0 items-center"
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center sm:block">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                        airport.rank <= 3
                          ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800"
                          : "bg-[var(--color-surface-alt)] text-[var(--color-muted)]"
                      }`}
                    >
                      {airport.rank}
                    </span>
                  </div>

                  {/* Airport name */}
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[var(--color-foreground)]">
                            {airport.name}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                            }}
                          >
                            {airport.code}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">
                          {airport.city}, {airport.country}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Region (hidden on mobile, shown via badge) */}
                  <div className="col-span-2 hidden sm:block">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {airport.region}
                    </span>
                  </div>

                  {/* Passengers */}
                  <div className="col-span-2 sm:text-right">
                    <span className="sm:hidden text-xs text-[var(--color-muted)]">
                      Passengers:{" "}
                    </span>
                    <span className="font-bold text-sm text-[var(--color-foreground)]">
                      {airport.passengers}M
                    </span>
                  </div>

                  {/* Airlines */}
                  <div className="col-span-1 sm:text-right">
                    <span className="sm:hidden text-xs text-[var(--color-muted)]">
                      Airlines:{" "}
                    </span>
                    <span className="text-sm text-[var(--color-muted)]">
                      {airport.airlinesCount}
                    </span>
                  </div>

                  {/* Countries */}
                  <div className="col-span-1 sm:text-right">
                    <span className="sm:hidden text-xs text-[var(--color-muted)]">
                      Countries:{" "}
                    </span>
                    <span className="text-sm text-[var(--color-muted)]">
                      {airport.countriesConnected}
                    </span>
                  </div>

                  {/* Growth */}
                  <div className="col-span-1 sm:text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      {airport.change}%
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Show more / Show less */}
          {filtered.length > PAGE_SIZE && (
            <div className="px-6 py-4 text-center border-t border-[var(--color-border)]">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm font-medium text-[var(--color-accent)] hover:underline transition-colors"
              >
                {showAll
                  ? "Show fewer airports"
                  : `Show all ${filtered.length} airports`}
              </button>
            </div>
          )}
        </div>

        {/* Region breakdown */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(regionColors)
            .filter(([region]) => {
              return popularAirports.some((a) => a.region === region);
            })
            .map(([region, colors]) => {
              const regionAirports = popularAirports.filter(
                (a) => a.region === region
              );
              const regionPassengers = regionAirports.reduce(
                (sum, a) => sum + a.passengers,
                0
              );
              return (
                <button
                  key={region}
                  onClick={() =>
                    setSelectedRegion(
                      selectedRegion === region ? "All" : region
                    )
                  }
                  className={`region-breakdown-card rounded-xl p-4 text-left border transition-all ${
                    selectedRegion === region
                      ? "ring-2 ring-offset-1"
                      : "hover:shadow-md"
                  }`}
                  style={{
                    backgroundColor:
                      selectedRegion === region ? colors.bg : "white",
                    borderColor:
                      selectedRegion === region
                        ? colors.accent
                        : "var(--color-border)",
                    ...(selectedRegion === region
                      ? { ringColor: colors.accent }
                      : {}),
                  }}
                >
                  <div
                    className="text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: colors.text }}
                  >
                    {region}
                  </div>
                  <div className="text-lg font-bold text-[var(--color-foreground)]">
                    {regionAirports.length}
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">
                    {regionPassengers.toFixed(1)}M pax
                  </div>
                </button>
              );
            })}
        </div>

        <p className="mt-6 text-xs text-[var(--color-muted)] text-center">
          Data based on publicly available annual passenger traffic statistics. Figures are approximate and may vary by source.
        </p>
      </div>
    </section>
  );
}
