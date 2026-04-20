"use client";

/**
 * GlobalField — Phase 6.
 *
 * Anonymous opt-in visualisation of practitioners worldwide.
 * Phase 6.0 ships a synthetic count + rhythm so the indicator is
 * visible. Phase 6.1+ wires a tiny privacy-preserving relay that
 * counts active sessions without identifying anyone.
 */

import { useEffect, useState } from "react";

export type GlobalFieldState = {
  active: number;
  meanCoherence: number;
  pulseAt: number | null;
};

export function useGlobalField(enabled: boolean): GlobalFieldState {
  const [state, setState] = useState<GlobalFieldState>({ active: 0, meanCoherence: 0, pulseAt: null });
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      // Synthetic Phase 6.0 model: smoothly varying participant count
      // and coherence around quiet baselines so the indicator lives.
      const t = Date.now() / 1000;
      const count = Math.floor(40 + 30 * Math.sin(t / 600) + 20 * Math.sin(t / 87));
      const coh = Math.round(50 + 20 * Math.sin(t / 450 + 1));
      setState({
        active: Math.max(0, count),
        meanCoherence: Math.max(0, Math.min(100, coh)),
        pulseAt: Math.floor(t / 5) % 2 === 0 ? Date.now() : null,
      });
    };
    tick();
    const id = window.setInterval(tick, 1500);
    return () => { active = false; window.clearInterval(id); };
  }, [enabled]);
  return state;
}

export function GlobalFieldIndicator({ enabled }: { enabled: boolean }) {
  const field = useGlobalField(enabled);
  if (!enabled) return null;
  return (
    <div className="select-text rounded-full bg-black/50 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.25em] text-lunar-silver/85 backdrop-blur">
      Field · {field.active} · {field.meanCoherence}
    </div>
  );
}
