"use client";

import { useEffect, useRef, useState } from "react";
import type { Route, Airport } from "@/data/types";

interface RouteMapProps {
  routes: Route[];
  hubs: Airport[];
  airlineName: string;
  accentColor: string;
}

export default function RouteMap({
  routes,
  hubs,
  airlineName,
  accentColor,
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const loadMap = async () => {
      const L = (await import("leaflet")).default;
      // @ts-expect-error CSS import
      await import("leaflet/dist/leaflet.css");

      const map = L.map(mapRef.current!, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 8,
        worldCopyJump: true,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      const hubCodes = new Set(hubs.map((h) => h.code));
      const allAirports = new Map<string, Airport>();
      const validRoutes = routes.filter((r) => r && r.from && r.to);

      validRoutes.forEach((r) => {
        allAirports.set(r.from.code, r.from);
        allAirports.set(r.to.code, r.to);
      });

      validRoutes.forEach((r) => {
        const geodesicPoints = computeGeodesic(
          r.from.lat,
          r.from.lng,
          r.to.lat,
          r.to.lng
        );

        L.polyline(geodesicPoints, {
          color: accentColor,
          weight: 1.5,
          opacity: 0.35,
          dashArray: "4 4",
        }).addTo(map);
      });

      allAirports.forEach((airport) => {
        const isHub = hubCodes.has(airport.code);
        const connectionCount = validRoutes.filter(
          (r) => r.from.code === airport.code || r.to.code === airport.code
        ).length;

        const marker = L.circleMarker([airport.lat, airport.lng], {
          radius: isHub ? 7 : Math.max(3, Math.min(5, connectionCount / 3)),
          fillColor: isHub ? accentColor : "#64748b",
          color: isHub ? "#ffffff" : "#94a3b8",
          weight: isHub ? 2.5 : 1,
          opacity: 1,
          fillOpacity: isHub ? 1 : 0.7,
        }).addTo(map);

        marker.bindPopup(
          `<div style="font-family:system-ui;min-width:160px">` +
            `<div style="font-weight:700;font-size:14px;margin-bottom:2px">${airport.code}</div>` +
            `<div style="font-size:12px;color:#475569">${airport.name}</div>` +
            `<div style="font-size:12px;color:#64748b">${airport.city}, ${airport.country}</div>` +
            (isHub
              ? `<div style="margin-top:6px;font-size:11px;font-weight:600;color:${accentColor}">HUB</div>`
              : "") +
            `</div>`
        );
      });

      const bounds = L.latLngBounds(
        Array.from(allAirports.values()).map((a) => [a.lat, a.lng])
      );
      map.fitBounds(bounds, { padding: [40, 40] });

      setIsLoaded(true);
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [routes, hubs, accentColor]);

  return (
    <div className="relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-alt)] rounded-xl z-10">
          <div className="flex items-center gap-3 text-[var(--color-muted)]">
            <svg
              className="animate-spin w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading route map...
          </div>
        </div>
      )}
      <div className="relative rounded-xl border border-[var(--color-border)] overflow-hidden bg-[#e8eef3]">
        <svg
          className="absolute inset-0 w-full h-full text-slate-300/70 pointer-events-none"
          viewBox="0 0 1000 520"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect width="1000" height="520" fill="#e8eef3" />
          <path d="M165 120 C225 75 315 90 350 135 C385 180 330 220 270 210 C215 200 130 180 165 120Z" fill="currentColor" />
          <path d="M250 225 C315 205 355 245 345 305 C332 378 275 418 230 360 C195 315 195 248 250 225Z" fill="currentColor" />
          <path d="M435 120 C500 95 610 100 660 140 C700 172 655 210 585 202 C515 195 430 175 435 120Z" fill="currentColor" />
          <path d="M520 230 C570 205 640 225 675 285 C710 345 682 415 620 430 C560 445 515 390 525 335 C532 294 490 252 520 230Z" fill="currentColor" />
          <path d="M675 135 C770 90 890 120 925 195 C955 260 885 300 800 272 C735 250 645 200 675 135Z" fill="currentColor" />
          <path d="M745 318 C825 292 910 335 925 398 C940 458 845 470 780 430 C730 398 700 342 745 318Z" fill="currentColor" />
          <path d="M485 72 C525 55 570 62 590 92 C555 105 510 108 485 72Z" fill="currentColor" />
          <path d="M120 455 C240 482 392 490 520 470 C675 446 805 456 930 478" stroke="#cbd5e1" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M80 290 C210 272 350 268 500 284 C635 298 780 290 940 270" stroke="#cbd5e1" strokeWidth="1.5" fill="none" opacity="0.55" />
        </svg>
        <div
          ref={mapRef}
          className="relative z-10 w-full bg-transparent"
          style={{ height: "520px", background: "transparent" }}
          aria-label={`${airlineName} route map`}
        />
      </div>
      <div className="flex flex-wrap gap-6 mt-4 text-xs text-[var(--color-muted)]">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: accentColor }}
          />
          Hub Airport
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
          Destination
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-6 border-t-2 border-dashed"
            style={{ borderColor: accentColor }}
          />
          Route
        </div>
      </div>
    </div>
  );
}

function computeGeodesic(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  numPoints = 50
): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const phi1 = toRad(lat1);
  const lambda1 = toRad(lng1);
  const phi2 = toRad(lat2);
  const lambda2 = toRad(lng2);

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((phi1 - phi2) / 2), 2) +
          Math.cos(phi1) *
            Math.cos(phi2) *
            Math.pow(Math.sin((lambda1 - lambda2) / 2), 2)
      )
    );

  if (d < 1e-10) return [[lat1, lng1]];

  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x =
      A * Math.cos(phi1) * Math.cos(lambda1) +
      B * Math.cos(phi2) * Math.cos(lambda2);
    const y =
      A * Math.cos(phi1) * Math.sin(lambda1) +
      B * Math.cos(phi2) * Math.sin(lambda2);
    const z = A * Math.sin(phi1) + B * Math.sin(phi2);
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lng = toDeg(Math.atan2(y, x));
    points.push([lat, lng]);
  }
  return points;
}
