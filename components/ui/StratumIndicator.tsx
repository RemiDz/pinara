"use client";

/**
 * StratumIndicator — quiet depth marker. A single Roman numeral in
 * the corner of the home view. No celebration; just a hint that the
 * field has shifted.
 */

import { useEffect, useState } from "react";
import { getStrataState, STRATA, type StrataState } from "@/lib/strata";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII"];

export function StratumIndicator() {
  const [state, setState] = useState<StrataState | null>(null);
  useEffect(() => { setState(getStrataState()); }, []);
  if (!state) return null;
  const def = STRATA.find((s) => s.id === state.highestUnlocked);
  if (!def) return null;
  return (
    <span
      className="font-oracle text-[11px] tracking-[0.4em] text-pineal-gold/70"
      title={def.key}
    >
      {ROMAN[state.highestUnlocked]}
    </span>
  );
}
