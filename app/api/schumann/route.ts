/**
 * /api/schumann — Schumann resonance + Kp proxy.
 *
 * If SCHUMANN_FEED_URL is set, fetch and normalise. Otherwise return a
 * deterministic baseline derived from the canonical eight cavity peaks
 * (7.83, 14.3, 20.8, 27.3, 33.8, 39, 45, 51 Hz) with synthetic amplitude
 * so the gland animates plausibly even with no upstream feed configured.
 *
 * Caching: edge cache 5 minutes; the client refreshes on its own cadence.
 */

import { NextResponse } from "next/server";

export const runtime = "edge";

type ProxyShape = {
  fundamentalHz?: number;
  amplitude?: number;
  kp?: number;
  observedAt?: string;
};

const FUNDAMENTAL_HZ = 7.83;

function syntheticBaseline(now: Date) {
  // Slow synthetic drift so the field "lives" for a no-feed deployment.
  const t = now.getTime() / 1000;
  const amp = 0.5 + 0.25 * Math.sin(t / 900) + 0.1 * Math.sin(t / 217);
  const kp = 1.5 + 1.0 * Math.sin(t / 7200);
  return {
    fundamentalHz: FUNDAMENTAL_HZ,
    amplitude: Math.max(0, Math.min(1, amp)),
    kp: Math.max(0, Math.min(9, kp)),
    source: "baseline" as const,
    observedAt: now.toISOString(),
  };
}

export async function GET() {
  const now = new Date();
  const upstream = process.env.SCHUMANN_FEED_URL;

  if (upstream) {
    try {
      const res = await fetch(upstream, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const raw = (await res.json()) as ProxyShape;
        const out = {
          fundamentalHz: raw.fundamentalHz ?? FUNDAMENTAL_HZ,
          amplitude: typeof raw.amplitude === "number" ? raw.amplitude : 0.5,
          kp: typeof raw.kp === "number" ? raw.kp : 2,
          source: "live" as const,
          observedAt: raw.observedAt ?? now.toISOString(),
        };
        return NextResponse.json(out, {
          headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
        });
      }
    } catch {
      // Fall through to baseline.
    }
  }

  return NextResponse.json(syntheticBaseline(now), {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
