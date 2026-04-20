/**
 * Strata system — Phase 4.
 *
 * Seven geological depths unlocked by sustained practice. Permanent;
 * no regression. Progress evaluated against `SessionStats` from
 * lib/storage.ts.
 *
 * The unlock conditions are intentionally generous in time but firm
 * in count — the rhythm of returning matters more than total minutes.
 */

import { getSessionStats, type SessionStats } from "./storage";

export type StratumId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type StratumDef = {
  id: StratumId;
  key: string;
  /** UI-facing label keys (i18n) */
  labelKey: string;
  /** Min cumulative sessions */
  minSessions: number;
  /** OR min cumulative minutes (whichever first) */
  minMinutes: number;
  unlocks: string[];
};

export const STRATA: readonly StratumDef[] = [
  { id: 1, key: "surface", labelKey: "strata.surface", minSessions: 0, minMinutes: 0, unlocks: ["basic"] },
  { id: 2, key: "resonance_field", labelKey: "strata.resonance_field", minSessions: 7, minMinutes: 90, unlocks: ["bhramari", "voice_responsive"] },
  { id: 3, key: "inner_sky", labelKey: "strata.inner_sky", minSessions: 21, minMinutes: 400, unlocks: ["natal_starfield"] },
  { id: 4, key: "oracle", labelKey: "strata.oracle", minSessions: 33, minMinutes: 0, unlocks: ["oracle_messages"] },
  { id: 5, key: "sacred_geometry", labelKey: "strata.sacred_geometry", minSessions: 50, minMinutes: 0, unlocks: ["mandala", "sri_yantra", "metatron"] },
  { id: 6, key: "chamber_ar", labelKey: "strata.chamber_ar", minSessions: 66, minMinutes: 0, unlocks: ["webxr_chamber"] },
  { id: 7, key: "the_flame", labelKey: "strata.the_flame", minSessions: 108, minMinutes: 0, unlocks: ["silent_dark_mode"] },
] as const;

export type StrataState = {
  highestUnlocked: StratumId;
  unlockedAt: Partial<Record<StratumId, number>>; // unix ms
};

const LS_KEY = "pinara.strata";

function readStrataState(): StrataState {
  if (typeof window === "undefined") return { highestUnlocked: 1, unlockedAt: { 1: Date.now() } };
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { highestUnlocked: 1, unlockedAt: { 1: Date.now() } };
    return JSON.parse(raw) as StrataState;
  } catch {
    return { highestUnlocked: 1, unlockedAt: { 1: Date.now() } };
  }
}

function writeStrataState(s: StrataState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* */
  }
}

export function getStrataState(): StrataState {
  return readStrataState();
}

export function evaluateStrata(stats: SessionStats = getSessionStats()): {
  state: StrataState;
  newlyUnlocked: StratumId[];
} {
  const prev = readStrataState();
  let highest = prev.highestUnlocked;
  const unlockedAt = { ...prev.unlockedAt };
  const newly: StratumId[] = [];
  for (const stratum of STRATA) {
    const meets = stratum.minSessions === 0 ||
      stats.totalSessions >= stratum.minSessions ||
      (stratum.minMinutes > 0 && stats.totalMinutes >= stratum.minMinutes);
    if (meets && stratum.id > highest) {
      highest = stratum.id;
      newly.push(stratum.id);
      unlockedAt[stratum.id] = Date.now();
    }
  }
  const next: StrataState = { highestUnlocked: highest, unlockedAt };
  if (newly.length > 0) writeStrataState(next);
  return { state: next, newlyUnlocked: newly };
}

export function isStratumUnlocked(id: StratumId, state?: StrataState): boolean {
  const s = state ?? readStrataState();
  return id <= s.highestUnlocked;
}

/** Convenience: does a given feature key (string in unlocks[]) gate? */
export function isFeatureUnlocked(featureKey: string, state?: StrataState): boolean {
  const s = state ?? readStrataState();
  for (const stratum of STRATA) {
    if (stratum.unlocks.includes(featureKey) && stratum.id <= s.highestUnlocked) return true;
  }
  return false;
}

/** Reset for testing only — never call from app code. */
export function _resetStrata(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(LS_KEY); } catch { /* */ }
}
