"use client";

/**
 * GateCalendar — Phase 7. Shows the next few moon-phase events and
 * the next solar gate. Reachable via long-press on the gland (we
 * route it as a separate /gates page; the gland-press shortcut is
 * Phase 7.1).
 */

import { useEffect, useState } from "react";
import { nextSolarGate, upcomingMoonPhases, type SolarGateEvent } from "@/lib/cosmic-events";

export function GateCalendar() {
  const [moonPhases, setMoonPhases] = useState<SolarGateEvent[]>([]);
  const [solar, setSolar] = useState<SolarGateEvent | null>(null);

  useEffect(() => {
    const now = new Date();
    setMoonPhases(upcomingMoonPhases(now, 4));
    setSolar(nextSolarGate(now));
  }, []);

  return (
    <div className="space-y-3 text-sm">
      <h3 className="text-xs uppercase tracking-[0.25em] text-pineal-gold">Coming gates</h3>
      <ul className="space-y-1 font-sans text-[12px]">
        {moonPhases.map((m, i) => (
          <li key={i} className="flex justify-between">
            <span className="text-lunar-silver/85">{labelFor(m.kind)}</span>
            <span className="font-mono text-lunar-silver/65">{formatDate(m.at)}</span>
          </li>
        ))}
        {solar ? (
          <li className="flex justify-between border-t border-lunar-silver/15 pt-1">
            <span className="text-lunar-silver/85">{labelFor(solar.kind)}</span>
            <span className="font-mono text-lunar-silver/65">{formatDate(solar.at)}</span>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function labelFor(k: SolarGateEvent["kind"]): string {
  return k.replace(/_/g, " ");
}

function formatDate(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 16);
}
