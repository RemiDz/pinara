/**
 * /api/ephemeris — server-side ephemeris snapshot.
 *
 * Uses astronomy-engine (pure JS, edge-runtime safe). Phase 4 will add
 * a parallel pyswisseph-backed Node route for high-precision lunar
 * returns and progressions; Phase 1 only needs current-state values.
 *
 * Query params:
 *   lat (number, default 51.5074)
 *   lng (number, default -0.1278)
 *   t   (ISO 8601, default now)
 */

import { NextResponse } from "next/server";
import {
  getMoonPhase,
  getPlanetaryHour,
  getSunPosition,
} from "@/lib/cosmic-math";

export const runtime = "edge";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get("lat") ?? "51.5074");
  const lng = parseFloat(url.searchParams.get("lng") ?? "-0.1278");
  const tParam = url.searchParams.get("t");
  const now = tParam ? new Date(tParam) : new Date();

  if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(now.getTime())) {
    return NextResponse.json(
      { error: "invalid query parameters" },
      { status: 400 },
    );
  }

  try {
    const planetaryHour = getPlanetaryHour(now, lat, lng);
    const moonPhase = getMoonPhase(now);
    const sunPosition = getSunPosition(now, lat, lng);

    return NextResponse.json(
      {
        observedAt: now.toISOString(),
        coords: { lat, lng },
        planetaryHour: {
          ...planetaryHour,
          startsAt: planetaryHour.startsAt.toISOString(),
          endsAt: planetaryHour.endsAt.toISOString(),
        },
        moonPhase,
        sunPosition,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ephemeris failed" },
      { status: 500 },
    );
  }
}
