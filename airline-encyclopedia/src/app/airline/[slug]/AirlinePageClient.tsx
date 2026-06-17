"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Airline, AircraftType } from "@/data/types";
import AircraftIllustration from "@/components/AircraftIllustration";

const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[var(--color-muted)]">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading map...
      </div>
    </div>
  ),
});

interface Props {
  airline: Airline;
}

type Tab = "history" | "fleet" | "routes";

export default function AirlinePageClient({ airline }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftType | null>(null);

  const fleetSize = airline.fleet.reduce((s, f) => s + f.count, 0);
  const uniqueDestinations = new Set<string>();
  airline.routes.forEach((r) => {
    if (r.from?.code) uniqueDestinations.add(r.from.code);
    if (r.to?.code) uniqueDestinations.add(r.to.code);
  });

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "history",
      label: "History",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: "fleet",
      label: `Fleet (${fleetSize})`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
    {
      key: "routes",
      label: `Route Map (${airline.routes.length})`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Hero Banner */}
      <section
        className="relative text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${airline.logoColor} 0%, ${airline.logoColor}dd 50%, ${airline.accentColor}99 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl transform translate-y-1/2" />
        </div>
        {/* Subtle airplane trail decoration */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" preserveAspectRatio="none">
          <path d="M-50,120 Q200,80 400,100 T850,60" stroke="white" strokeWidth="2" fill="none" strokeDasharray="8,12" />
          <path d="M-30,180 Q250,140 500,170 T900,110" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="6,10" />
          <circle cx="850" cy="60" r="4" fill="white" />
        </svg>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All Airlines
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-md backdrop-blur-sm">
                  {airline.iataCode} / {airline.icaoCode}
                </span>
                {airline.alliance !== "None" && (
                  <span className="text-sm bg-white/10 px-3 py-1 rounded-md backdrop-blur-sm">
                    {airline.alliance}
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-3">{airline.name}</h1>
              <p className="mt-3 text-lg text-white/80">
                {airline.country} &middot; Founded {airline.founded} &middot; HQ: {airline.headquarters}
              </p>
            </div>
            <div className="flex gap-6 sm:gap-8 text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-bold">{fleetSize}</div>
                <div className="text-xs text-white/60 uppercase tracking-wider mt-0.5">Aircraft</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold">{airline.fleet.length}</div>
                <div className="text-xs text-white/60 uppercase tracking-wider mt-0.5">Types</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold">{uniqueDestinations.size}</div>
                <div className="text-xs text-white/60 uppercase tracking-wider mt-0.5">Destinations</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold">{airline.hubs.length}</div>
                <div className="text-xs text-white/60 uppercase tracking-wider mt-0.5">Hubs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hub Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 relative z-10">
        <div className="bg-white rounded-xl shadow-md border border-[var(--color-border)] p-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mr-1">Hubs:</span>
          {airline.hubs.map((hub) => (
            <span
              key={hub.code}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: airline.logoColor + "10", color: airline.logoColor }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {hub.code} &mdash; {hub.city}
            </span>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex gap-1 border-b border-[var(--color-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Tab Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "history" && (
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">History of {airline.name}</h2>
            <div className="prose prose-lg max-w-none">
              {airline.history.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-[var(--color-foreground)] leading-relaxed mb-5 text-[15px]">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {activeTab === "fleet" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Fleet Overview</h2>
              <p className="text-sm text-[var(--color-muted)]">
                {airline.fleet.length} aircraft types &middot; {fleetSize} total aircraft
              </p>
            </div>

            {/* Fleet Summary Table */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface-alt)]">
                    <th className="text-left px-4 py-3 font-semibold text-[var(--color-muted)]">Aircraft</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--color-muted)]">Manufacturer</th>
                    <th className="text-center px-4 py-3 font-semibold text-[var(--color-muted)]">In Fleet</th>
                    <th className="text-center px-4 py-3 font-semibold text-[var(--color-muted)]">Passengers</th>
                    <th className="text-center px-4 py-3 font-semibold text-[var(--color-muted)]">Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {airline.fleet.map((ac) => (
                    <tr
                      key={ac.model}
                      className="hover:bg-[var(--color-surface-alt)] transition-colors cursor-pointer"
                      onClick={() => setSelectedAircraft(selectedAircraft?.model === ac.model ? null : ac)}
                    >
                      <td className="px-4 py-3 font-medium">{ac.model}</td>
                      <td className="px-4 py-3 text-[var(--color-muted)]">{ac.manufacturer}</td>
                      <td className="px-4 py-3 text-center font-semibold">{ac.count}</td>
                      <td className="px-4 py-3 text-center text-[var(--color-muted)]">{ac.passengers}</td>
                      <td className="px-4 py-3 text-center text-[var(--color-muted)]">{ac.range}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--color-surface-alt)] font-semibold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-center">{fleetSize}</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Fleet Cards with Images */}
            <h3 className="text-xl font-bold mb-4">Aircraft Gallery</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {airline.fleet.map((ac) => (
                <div
                  key={ac.model}
                  className="fleet-card bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm"
                  id={`fleet-${ac.model.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <div className="aspect-[16/9] overflow-hidden bg-[var(--color-surface-alt)] relative">
                    <AircraftIllustration
                      model={ac.model}
                      manufacturer={ac.manufacturer}
                      airlineColor={airline.logoColor}
                      airlineName={airline.name}
                    />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-md">
                      {ac.count} in fleet
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-lg">{ac.manufacturer} {ac.model}</h4>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--color-muted)] mb-3">{ac.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--color-surface-alt)] rounded-md text-[var(--color-muted)]">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {ac.passengers}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--color-surface-alt)] rounded-md text-[var(--color-muted)]">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {ac.range}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "routes" && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Route Network</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              Showing {airline.routes.length} routes from {airline.hubs.length} hub
              {airline.hubs.length > 1 ? "s" : ""} to {uniqueDestinations.size} destinations worldwide.
              Click on any airport marker for details.
            </p>
            <RouteMap
              routes={airline.routes}
              hubs={airline.hubs}
              accentColor={airline.accentColor}
            />

            {/* Routes List */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">All Routes</h3>
              <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[var(--color-surface-alt)]">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-[var(--color-muted)]">From</th>
                        <th className="text-center px-4 py-3 font-semibold text-[var(--color-muted)]"></th>
                        <th className="text-left px-4 py-3 font-semibold text-[var(--color-muted)]">To</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {airline.routes.filter(r => r.from && r.to).map((r, i) => (
                        <tr key={i} className="hover:bg-[var(--color-surface-alt)] transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="font-semibold">{r.from.code}</span>
                            <span className="text-[var(--color-muted)] ml-2">{r.from.city}</span>
                          </td>
                          <td className="text-center px-4 py-2.5">
                            <svg className="w-4 h-4 inline text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-semibold">{r.to.code}</span>
                            <span className="text-[var(--color-muted)] ml-2">{r.to.city}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
