"use client";

/**
 * SessionController — wires the chosen intent to the audio engine
 * and the gland's animated state. Owns the session timer, completion
 * detection, and IndexedDB session log.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AudioEngine, type ComposerSeed } from "@/components/audio/AudioEngine";
import { useCosmic } from "@/components/cosmic/CosmicContext";
import { recordSessionCompletion, saveSessionLog } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import type { IntentDefinition, SessionLengthMin } from "@/lib/intent";

export type SessionStatus = "idle" | "preparing" | "running" | "ending" | "complete";

export type SessionState = {
  status: SessionStatus;
  intent: IntentDefinition | null;
  durationMin: SessionLengthMin | null;
  startedAt: number | null;
  elapsedMs: number;
  remainingMs: number;
  completionPct: number;
};

const INITIAL_STATE: SessionState = {
  status: "idle",
  intent: null,
  durationMin: null,
  startedAt: null,
  elapsedMs: 0,
  remainingMs: 0,
  completionPct: 0,
};

export function useSessionController() {
  const cosmic = useCosmic();
  const [state, setState] = useState<SessionState>(INITIAL_STATE);
  const engineRef = useRef<AudioEngine | null>(null);
  const tickRef = useRef<number | null>(null);
  const seedRef = useRef<ComposerSeed | null>(null);
  const idRef = useRef<string | null>(null);

  const stop = useCallback(
    async (completed: boolean) => {
      if (!engineRef.current) return;
      setState((s) => ({ ...s, status: "ending" }));
      await engineRef.current.stop(6);
      engineRef.current = null;
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }

      const finalState = await new Promise<SessionState>((resolve) => {
        setState((s) => {
          const completionPct = completed ? 100 : Math.round(s.completionPct);
          const final: SessionState = {
            ...s,
            status: "complete",
            completionPct,
          };
          resolve(final);
          return final;
        });
      });

      if (finalState.intent && finalState.durationMin && finalState.startedAt && idRef.current) {
        recordSessionCompletion((finalState.elapsedMs / 60_000) | 0);
        await saveSessionLog({
          id: idRef.current,
          startedAt: finalState.startedAt,
          endedAt: Date.now(),
          durationMin: finalState.durationMin,
          intent: finalState.intent.id,
          completionPct: finalState.completionPct,
          cosmicSnapshot: {
            planetaryHour: cosmic.planetaryHour
              ? {
                  planet: cosmic.planetaryHour.planet,
                  isDayHour: cosmic.planetaryHour.isDayHour,
                  index: cosmic.planetaryHour.index,
                }
              : null,
            moonPhase: cosmic.moonPhase
              ? {
                  phaseName: cosmic.moonPhase.phaseName,
                  illumination: cosmic.moonPhase.illumination,
                }
              : null,
            schumann: cosmic.schumann
              ? {
                  fundamentalHz: cosmic.schumann.fundamentalHz,
                  amplitude: cosmic.schumann.amplitude,
                  kp: cosmic.schumann.kp,
                  source: cosmic.schumann.source,
                }
              : null,
          },
          composerSeed: seedRef.current
            ? `${seedRef.current.intent}.${seedRef.current.randomSeed}`
            : "",
        });
        if (completed) {
          trackEvent("session_complete", {
            intent: finalState.intent.id,
            duration: finalState.durationMin,
          });
        }
      }
    },
    [cosmic],
  );

  const start = useCallback(
    async (intent: IntentDefinition, durationMin: SessionLengthMin) => {
      if (state.status !== "idle" && state.status !== "complete") return;
      setState({
        status: "preparing",
        intent,
        durationMin,
        startedAt: null,
        elapsedMs: 0,
        remainingMs: durationMin * 60_000,
        completionPct: 0,
      });

      const engine = new AudioEngine();
      await engine.unlock();
      const seed = engine.start({
        intent,
        schumannFundamentalHz: cosmic.schumann?.fundamentalHz,
      });
      engineRef.current = engine;
      seedRef.current = seed;
      idRef.current = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

      const startedAt = Date.now();
      const totalMs = durationMin * 60_000;
      setState((s) => ({ ...s, status: "running", startedAt }));

      trackEvent("session_start", {
        intent: intent.id,
        duration: durationMin,
        planet: cosmic.planetaryHour?.planet,
      });

      tickRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, totalMs - elapsed);
        const pct = Math.min(100, (elapsed / totalMs) * 100);
        setState((s) => ({ ...s, elapsedMs: elapsed, remainingMs: remaining, completionPct: pct }));
        if (remaining <= 0) {
          void stop(true);
        }
      }, 250);
    },
    [cosmic, state.status, stop],
  );

  useEffect(() => {
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
      engineRef.current?.dispose();
    };
  }, []);

  return useMemo(
    () => ({
      state,
      start,
      stop: () => void stop(false),
      isActive: state.status === "running" || state.status === "preparing" || state.status === "ending",
    }),
    [state, start, stop],
  );
}
