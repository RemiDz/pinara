"use client";

/**
 * CosmicContext — single source of truth for live cosmic state.
 *
 * Components NEVER compute their own planetary hour / Moon phase.
 * They subscribe through this context, which refreshes at adaptive
 * cadence (60s for the local maths, 5min for Schumann, hourly for
 * planetary hour boundaries).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getMoonPhase,
  getPlanetaryHour,
  getSunPosition,
  type MoonPhaseInfo,
  type PlanetaryHour,
  type SunPosition,
} from "@/lib/cosmic-math";
import { fetchSchumann, type SchumannReading } from "./SchumannFeed";

export type Coordinates = { lat: number; lng: number; source: "geo" | "default" };

const FALLBACK_COORDS: Coordinates = { lat: 51.5074, lng: -0.1278, source: "default" };

export type CosmicState = {
  now: Date;
  coords: Coordinates;
  planetaryHour: PlanetaryHour | null;
  moonPhase: MoonPhaseInfo | null;
  sunPosition: SunPosition | null;
  schumann: SchumannReading | null;
  loading: boolean;
  error: string | null;
};

type CosmicContextValue = CosmicState & {
  refresh: () => void;
  setCoords: (coords: Coordinates) => void;
};

const CosmicCtx = createContext<CosmicContextValue | null>(null);

const LOCAL_REFRESH_MS = 60_000;
const SCHUMANN_REFRESH_MS = 5 * 60_000;

export function CosmicProvider({ children }: { children: ReactNode }) {
  const [coords, setCoordsState] = useState<Coordinates>(FALLBACK_COORDS);
  const [state, setState] = useState<CosmicState>({
    now: new Date(),
    coords: FALLBACK_COORDS,
    planetaryHour: null,
    moonPhase: null,
    sunPosition: null,
    schumann: null,
    loading: true,
    error: null,
  });

  const schumannAbortRef = useRef<AbortController | null>(null);

  const recomputeLocal = useCallback((c: Coordinates) => {
    const now = new Date();
    try {
      setState((s) => ({
        ...s,
        now,
        coords: c,
        planetaryHour: getPlanetaryHour(now, c.lat, c.lng),
        moonPhase: getMoonPhase(now),
        sunPosition: getSunPosition(now, c.lat, c.lng),
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "cosmic compute failed",
      }));
    }
  }, []);

  const refreshSchumann = useCallback(async () => {
    schumannAbortRef.current?.abort();
    const ctl = new AbortController();
    schumannAbortRef.current = ctl;
    try {
      const reading = await fetchSchumann(ctl.signal);
      setState((s) => ({ ...s, schumann: reading }));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      // Schumann feed failure is non-fatal — keep last known reading.
    }
  }, []);

  const refresh = useCallback(() => {
    recomputeLocal(coords);
    void refreshSchumann();
  }, [coords, recomputeLocal, refreshSchumann]);

  const setCoords = useCallback(
    (c: Coordinates) => {
      setCoordsState(c);
      recomputeLocal(c);
    },
    [recomputeLocal],
  );

  // Try geolocation once on mount. Quiet failure → keep fallback.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      recomputeLocal(coords);
      return;
    }
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const next: Coordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "geo",
        };
        setCoordsState(next);
        recomputeLocal(next);
      },
      () => {
        if (cancelled) return;
        recomputeLocal(coords);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60 * 60 * 1000 },
    );
    return () => {
      cancelled = true;
    };
    // Intentionally only on mount — coords drive the second effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local cosmic refresh every 60s.
  useEffect(() => {
    recomputeLocal(coords);
    const id = window.setInterval(() => recomputeLocal(coords), LOCAL_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [coords, recomputeLocal]);

  // Schumann refresh every 5 min, plus an immediate first read.
  useEffect(() => {
    void refreshSchumann();
    const id = window.setInterval(() => void refreshSchumann(), SCHUMANN_REFRESH_MS);
    return () => {
      window.clearInterval(id);
      schumannAbortRef.current?.abort();
    };
  }, [refreshSchumann]);

  const value = useMemo<CosmicContextValue>(
    () => ({ ...state, refresh, setCoords }),
    [state, refresh, setCoords],
  );

  return <CosmicCtx.Provider value={value}>{children}</CosmicCtx.Provider>;
}

export function useCosmic(): CosmicContextValue {
  const v = useContext(CosmicCtx);
  if (!v) throw new Error("useCosmic must be used inside <CosmicProvider>");
  return v;
}
