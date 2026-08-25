"use client";

import { useMemo, useState } from "react";
import { flights, type Flight, type FlightDirection } from "@/data/flights";

type View = "all" | FlightDirection;

const statusClass: Record<Flight["status"], string> = {
  "On time": "status-good",
  Boarding: "status-boarding",
  Delayed: "status-delayed",
  Landed: "status-landed",
  "Gate closed": "status-closed",
};

function ArrowIcon({ direction }: { direction: FlightDirection }) {
  return (
    <svg
      className={`direction-icon ${direction}`}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
    >
      <path d="M5 19 19 5M9 5h10v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlightDetail({ flight, onClose }: { flight: Flight; onClose: () => void }) {
  return (
    <div className="detail-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${flight.flight} details`}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="detail-close" onClick={onClose} aria-label="Close flight details">
          ×
        </button>
        <div className="detail-kicker">Flight details</div>
        <div className="detail-airline">
          <span className="airline-mark large" style={{ background: flight.accent }}>
            {flight.airlineCode}
          </span>
          <div>
            <h2>{flight.flight}</h2>
            <p>{flight.airline}</p>
          </div>
        </div>
        <div className="detail-route">
          <div>
            <span>{flight.direction === "arrival" ? flight.airport : "SFO"}</span>
            <small>{flight.direction === "arrival" ? flight.city : "San Francisco"}</small>
          </div>
          <div className="route-line">
            <span />
            <ArrowIcon direction={flight.direction} />
            <span />
          </div>
          <div>
            <span>{flight.direction === "arrival" ? "SFO" : flight.airport}</span>
            <small>{flight.direction === "arrival" ? "San Francisco" : flight.city}</small>
          </div>
        </div>
        <div className="detail-grid">
          <div><small>Scheduled</small><strong>{flight.scheduled}</strong></div>
          <div><small>Estimated</small><strong>{flight.estimated}</strong></div>
          <div><small>Terminal</small><strong>{flight.terminal}</strong></div>
          <div><small>Gate</small><strong>{flight.gate}</strong></div>
        </div>
        <div className="detail-aircraft">
          <span>Aircraft</span>
          <strong>{flight.aircraft}</strong>
        </div>
        <div className={`detail-status ${statusClass[flight.status]}`}>
          <span className="status-dot" />
          {flight.status}
        </div>
      </aside>
    </div>
  );
}

export default function HomePage() {
  const [view, setView] = useState<View>("all");
  const [search, setSearch] = useState("");
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [updated, setUpdated] = useState("Just now");

  const visibleFlights = useMemo(() => {
    const query = search.trim().toLowerCase();
    return flights.filter((flight) => {
      const matchesView = view === "all" || flight.direction === view;
      const matchesQuery =
        !query ||
        [flight.flight, flight.airline, flight.city, flight.airport]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesView && matchesQuery;
    });
  }, [search, view]);

  const refresh = () => {
    setUpdated("Just now");
    window.setTimeout(() => setUpdated("A few seconds ago"), 3000);
  };

  return (
    <main className="dashboard">
      <section className="hero-shell" id="airport">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" />
            Live at San Francisco International
          </div>
          <h1>Every flight.<br /><em>One clear view.</em></h1>
          <p>Track arrivals and departures at SFO in real time.</p>
        </div>
        <div className="airport-card">
          <div className="airport-code">
            <span>SFO</span>
            <small>KSFO</small>
          </div>
          <div className="airport-meta">
            <span>San Francisco</span>
            <strong>16:51 PDT</strong>
          </div>
          <div className="weather">
            <svg aria-hidden="true" viewBox="0 0 28 28">
              <path d="M8 21h13a5 5 0 0 0 .3-10A7.5 7.5 0 0 0 7 9.5 5.8 5.8 0 0 0 8 21Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            <div><strong>61°F</strong><span>Wind W 14 mph</span></div>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Airport summary">
        <article><span className="stat-icon inbound"><ArrowIcon direction="arrival" /></span><div><strong>42</strong><span>Arriving today</span></div><small>3 in the next hour</small></article>
        <article><span className="stat-icon outbound"><ArrowIcon direction="departure" /></span><div><strong>38</strong><span>Departing today</span></div><small>5 in the next hour</small></article>
        <article><span className="stat-icon punctual"><ClockIcon /></span><div><strong>87%</strong><span>On time</span></div><small>↑ 4% from yesterday</small></article>
      </section>

      <section className="flight-board" id="flights">
        <div className="board-header">
          <div>
            <h2>Flight board</h2>
            <p>Tuesday, August 25</p>
          </div>
          <button className="refresh-button" onClick={refresh} aria-label="Refresh flight data">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6v5h-5M4 18v-5h5" /><path d="M6.1 9a7 7 0 0 1 11.8-2.6L20 8M4 16l2.1 1.6A7 7 0 0 0 17.9 15" /></svg>
            Updated {updated}
          </button>
        </div>

        <div className="board-controls">
          <div className="view-tabs" role="tablist" aria-label="Flight direction">
            {(["all", "arrival", "departure"] as View[]).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={view === tab}
                className={view === tab ? "active" : ""}
                onClick={() => setView(tab)}
              >
                {tab === "all" ? "All flights" : `${tab === "arrival" ? "Arrivals" : "Departures"} · ${flights.filter((f) => f.direction === tab).length}`}
              </button>
            ))}
          </div>
          <label className="search-box">
            <SearchIcon />
            <span className="sr-only">Search flights</span>
            <input
              id="flight-search"
              name="flight-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Flight, city, or airline"
            />
            <kbd>⌘ K</kbd>
          </label>
        </div>

        <div className="flight-table">
          <div className="table-head">
            <span>Flight</span><span>Route</span><span>Scheduled</span><span>Est.</span><span>Gate</span><span>Status</span><span />
          </div>
          {visibleFlights.length ? visibleFlights.map((flight) => (
            <button className="flight-row" key={flight.id} onClick={() => setSelectedFlight(flight)}>
              <span className="flight-airline">
                <span className="airline-mark" style={{ background: flight.accent }}>{flight.airlineCode}</span>
                <span><strong>{flight.flight}</strong><small>{flight.airline}</small></span>
              </span>
              <span className="flight-route">
                <ArrowIcon direction={flight.direction} />
                <span><strong>{flight.city}</strong><small>{flight.airport}</small></span>
              </span>
              <strong>{flight.scheduled}</strong>
              <strong className={flight.estimated !== flight.scheduled ? "time-changed" : ""}>{flight.estimated}</strong>
              <span className="gate"><strong>{flight.gate}</strong><small>Terminal {flight.terminal}</small></span>
              <span className={`status-pill ${statusClass[flight.status]}`}><span className="status-dot" />{flight.status}</span>
              <span className="row-chevron">›</span>
            </button>
          )) : (
            <div className="empty-state">
              <SearchIcon />
              <strong>No flights found</strong>
              <span>Try another flight number, city, or airline.</span>
              <button onClick={() => { setSearch(""); setView("all"); }}>Clear filters</button>
            </div>
          )}
        </div>
        <div className="board-footer">
          <span>Showing {visibleFlights.length} of {flights.length} flights</span>
          <span>Times shown in Pacific Daylight Time</span>
        </div>
      </section>

      <section className="notice">
        <span>i</span>
        <p><strong>Demo flight data</strong> Flight information is representative. Confirm current details with your airline before traveling.</p>
      </section>

      {selectedFlight && <FlightDetail flight={selectedFlight} onClose={() => setSelectedFlight(null)} />}
    </main>
  );
}
