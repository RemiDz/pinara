/**
 * Sentry client config.
 *
 * Per locked decisions: strip all biometric payloads from error context
 * via beforeSend. Honour the user's opt-out preference.
 */

import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend: (event) => {
      try {
        const optOut = typeof window !== "undefined" &&
          window.localStorage?.getItem("pinara.prefs")?.includes('"sentryOptOut":true');
        if (optOut) return null;
      } catch {
        // localStorage may be disabled — proceed and let beforeSend continue.
      }
      return stripBiometrics(event);
    },
    initialScope: {
      tags: { app: "pinara", phase: "1" },
    },
  });
}

const BIOMETRIC_KEYS = new Set([
  "hrv",
  "rmssd",
  "sdnn",
  "lf",
  "hf",
  "coherence",
  "breathRate",
  "voiceF0",
  "f0",
  "formants",
  "jitter",
  "shimmer",
  "hnr",
  "eyeOpenness",
  "blinkRate",
  "pupilDiameter",
  "depthScore",
  "driftScore",
  "eeg",
  "delta",
  "theta",
  "alpha",
  "beta",
  "gamma",
  "heartRateBpm",
  "ppg",
]);

function stripBiometrics<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripBiometrics(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (BIOMETRIC_KEYS.has(k)) continue;
      out[k] = stripBiometrics(v);
    }
    return out as unknown as T;
  }
  return value;
}
