"use client";

/**
 * /gland-harness — isolated gland tuner.
 *
 * Cycle through the six intent palettes, toggle session pulse, dim
 * intensity. No audio, no cosmic context required for shader work.
 */

import { useState } from "react";
import { GlandWebGL } from "@/components/gland/GlandWebGL";
import { CosmicProvider } from "@/components/cosmic/CosmicContext";
import { I18nProvider } from "@/lib/i18n-react";
import { INTENTS } from "@/lib/intent";

export default function GlandHarness() {
  const [intentIdx, setIntentIdx] = useState(0);
  const [intensity, setIntensity] = useState(1);
  const [inSession, setInSession] = useState(false);
  const intent = INTENTS[intentIdx];

  return (
    <I18nProvider locale="en">
      <CosmicProvider>
        <main className="relative h-[100dvh] w-screen bg-chamber text-lunar-silver">
          <div className="absolute inset-0">
            <GlandWebGL intent={intent} intensity={intensity} inSession={inSession} />
          </div>
          <div className="pointer-events-auto absolute left-4 top-4 max-w-xs space-y-3 rounded-2xl bg-black/70 p-4 font-sans text-xs backdrop-blur">
            <h1 className="text-sm font-semibold tracking-wide text-pineal-gold">Gland harness</h1>
            <div>
              <div className="mb-1 text-lunar-silver/60">Intent: {intent.label.en}</div>
              <div className="flex flex-wrap gap-1">
                {INTENTS.map((it, i) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setIntentIdx(i)}
                    className="rounded-full border border-lunar-silver/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] data-[active=true]:border-pineal-gold data-[active=true]:text-pineal-gold"
                    data-active={i === intentIdx}
                  >
                    {it.label.en}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-lunar-silver/60">Intensity {intensity.toFixed(2)}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={intensity}
                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                className="mt-1 w-full"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={inSession}
                onChange={(e) => setInSession(e.target.checked)}
              />
              <span>Session pulse</span>
            </label>
          </div>
        </main>
      </CosmicProvider>
    </I18nProvider>
  );
}
