/**
 * Plausible analytics wrapper.
 *
 * Privacy: Plausible is cookieless, no personal data. We define the
 * full event vocabulary for Phase 1 here so the call sites stay
 * type-safe and the events are easy to enumerate for the Plausible
 * dashboard config.
 */

import type { IntentId } from "./intent";

type EventVocab = {
  session_start: { intent: IntentId; duration: number; planet?: string };
  session_complete: { intent: IntentId; duration: number };
  intent_chosen: { intent: IntentId };
  darkness_entered: Record<string, never>;
  darkness_exited: Record<string, never>;
  capability_banner_shown: { missing: string };
  // Placeholder events for later phases — kept here so Plausible
  // dashboards can be configured before code lands.
  strata_unlock?: { stratum: number };
  oracle_received?: { stratum: number };
  ceremony_started?: Record<string, never>;
  seed_issued?: Record<string, never>;
  wearable_connected?: { kind: string };
  ar_chamber_entered?: Record<string, never>;
  window_of_power_fired?: Record<string, never>;
};

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
  }
}

export function trackEvent<K extends keyof EventVocab>(
  event: K,
  props?: EventVocab[K],
): void {
  if (typeof window === "undefined") return;
  try {
    window.plausible?.(event, props ? { props: props as Record<string, unknown> } : undefined);
  } catch {
    // Analytics failures must never crash the session UI.
  }
}
