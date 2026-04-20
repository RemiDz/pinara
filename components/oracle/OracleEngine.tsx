"use client";

/**
 * OracleEngine — Phase 7. Surfaces an oracle line after a session
 * completes, when the practitioner has reached Stratum 4 (Oracle).
 * Persists to IndexedDB-backed Oracle Archive (Phase 4.1+).
 */

import { useCallback, useState } from "react";

export type OracleResult = { source: "fallback" | "claude"; text: string; symbol: string; seed: number };

export function useOracle() {
  const [result, setResult] = useState<OracleResult | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(async (input: {
    intent?: string;
    stratum?: number;
    seed?: number;
    cosmic?: { planetaryHour?: string; moonPhase?: string };
  }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`oracle ${res.status}`);
      const data = (await res.json()) as OracleResult;
      setResult(data);
      return data;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, request };
}

export function OracleDisplay({ result }: { result: OracleResult | null }) {
  if (!result) return null;
  return (
    <div className="rounded-2xl bg-indigo-deep/85 p-5 text-center backdrop-blur">
      <p className="select-text font-oracle text-lg leading-relaxed text-pineal-gold">
        {result.text}
      </p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-lunar-silver/45">
        {result.symbol.replace(/_/g, " ")} · {result.source}
      </p>
    </div>
  );
}
