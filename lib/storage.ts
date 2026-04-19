/**
 * Storage layer — localStorage for preferences/strata, IndexedDB for
 * session logs and oracle archive (Phase 4+).
 *
 * Phase 1 only uses localStorage. IndexedDB plumbing here is the
 * minimum surface so later phases can land without a refactor.
 */

import type { IntentId } from "./intent";

const LS_PREFIX = "pinara.";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function lsGet<T extends Json>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: Json): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    // quota exceeded or storage disabled — silent fall-through is fine in Phase 1
  }
}

export type Preferences = {
  locale: "en" | "lt";
  sentryOptOut: boolean;
  defaultLengthMin: 11 | 22 | 33;
  lastIntent: IntentId | null;
};

const DEFAULT_PREFS: Preferences = {
  locale: "en",
  sentryOptOut: false,
  defaultLengthMin: 22,
  lastIntent: null,
};

export function getPreferences(): Preferences {
  return { ...DEFAULT_PREFS, ...lsGet<Partial<Preferences>>("prefs", {}) };
}

export function setPreferences(patch: Partial<Preferences>): Preferences {
  const next = { ...getPreferences(), ...patch };
  lsSet("prefs", next as unknown as Json);
  return next;
}

/** Strata unlocks. Phase 1 only stores cumulative session counts;
 *  unlock evaluation is in Phase 4's strata.ts. */
export type SessionStats = {
  totalSessions: number;
  totalMinutes: number;
  firstSessionAt: number | null; // unix ms
  lastSessionAt: number | null;
};

export function getSessionStats(): SessionStats {
  return {
    totalSessions: 0,
    totalMinutes: 0,
    firstSessionAt: null,
    lastSessionAt: null,
    ...lsGet<Partial<SessionStats>>("stats", {}),
  };
}

export function recordSessionCompletion(durationMin: number): SessionStats {
  const now = Date.now();
  const prev = getSessionStats();
  const next: SessionStats = {
    totalSessions: prev.totalSessions + 1,
    totalMinutes: prev.totalMinutes + durationMin,
    firstSessionAt: prev.firstSessionAt ?? now,
    lastSessionAt: now,
  };
  lsSet("stats", next as unknown as Json);
  return next;
}

// ----- IndexedDB session log (minimal Phase 1 surface) -----

const DB_NAME = "pinara";
const DB_VERSION = 1;
const STORE_SESSIONS = "sessions";

export type SessionLogEntry = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  durationMin: number;
  intent: IntentId;
  completionPct: number;
  cosmicSnapshot: Record<string, unknown>;
  composerSeed: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const store = db.createObjectStore(STORE_SESSIONS, { keyPath: "id" });
        store.createIndex("startedAt", "startedAt");
      }
    };
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
  });
}

export async function saveSessionLog(entry: SessionLogEntry): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, "readwrite");
      tx.objectStore(STORE_SESSIONS).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("indexedDB tx failed"));
    });
    db.close();
  } catch {
    // Storage failures must not crash the session UI in Phase 1.
  }
}

export async function listRecentSessions(limit = 10): Promise<SessionLogEntry[]> {
  try {
    const db = await openDb();
    const out = await new Promise<SessionLogEntry[]>((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, "readonly");
      const idx = tx.objectStore(STORE_SESSIONS).index("startedAt");
      const req = idx.openCursor(null, "prev");
      const acc: SessionLogEntry[] = [];
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor && acc.length < limit) {
          acc.push(cursor.value as SessionLogEntry);
          cursor.continue();
        } else {
          resolve(acc);
        }
      };
      req.onerror = () => reject(req.error ?? new Error("indexedDB read failed"));
    });
    db.close();
    return out;
  } catch {
    return [];
  }
}
