"use client";

/**
 * /audio-harness — isolated DSP bench.
 *
 * Phase 1: pick an intent, hit Begin, hear the three-layer composer
 * with no UI distractions. Phase 3 will populate this with per-layer
 * solo/mute and live FFT.
 */

import { useEffect, useRef, useState } from "react";
import { AudioEngine, type ComposerSeed } from "@/components/audio/AudioEngine";
import { INTENTS, type IntentDefinition } from "@/lib/intent";

export default function AudioHarness() {
  const [intent, setIntent] = useState<IntentDefinition>(INTENTS[1]);
  const [running, setRunning] = useState(false);
  const [seed, setSeed] = useState<ComposerSeed | null>(null);
  const engineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
    };
  }, []);

  const begin = async () => {
    if (running) return;
    const e = new AudioEngine();
    await e.unlock();
    const s = e.start({ intent });
    engineRef.current = e;
    setSeed(s);
    setRunning(true);
  };

  const end = async () => {
    if (!engineRef.current) return;
    await engineRef.current.stop(3);
    engineRef.current = null;
    setRunning(false);
  };

  return (
    <main className="min-h-[100dvh] w-screen bg-chamber p-6 text-lunar-silver">
      <div className="mx-auto max-w-md space-y-4 font-sans text-sm">
        <h1 className="text-lg font-semibold text-pineal-gold">Audio harness</h1>
        <p className="text-lunar-silver/70">
          Three-layer composer (binaural + drone + solfeggio overtone). Headphones recommended.
        </p>
        <div>
          <div className="mb-1 text-xs uppercase tracking-[0.2em] text-lunar-silver/60">Intent</div>
          <div className="flex flex-wrap gap-2">
            {INTENTS.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => setIntent(i)}
                disabled={running}
                className="rounded-full border border-lunar-silver/30 px-3 py-1 text-xs uppercase tracking-[0.18em] disabled:opacity-50 data-[active=true]:border-pineal-gold data-[active=true]:text-pineal-gold"
                data-active={i.id === intent.id}
              >
                {i.label.en}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          {!running ? (
            <button
              type="button"
              onClick={begin}
              className="rounded-full bg-pineal-gold px-5 py-2 text-xs uppercase tracking-[0.3em] text-indigo-deep"
            >
              Begin
            </button>
          ) : (
            <button
              type="button"
              onClick={end}
              className="rounded-full border border-lunar-silver/40 px-5 py-2 text-xs uppercase tracking-[0.3em]"
            >
              End
            </button>
          )}
        </div>
        {seed ? (
          <pre className="select-text overflow-auto rounded-xl bg-black/40 p-3 text-[11px] text-lunar-silver/80">
            {JSON.stringify(seed, null, 2)}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
