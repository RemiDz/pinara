"use client";

/**
 * /audio-harness — Phase 3.0.
 *
 * Pick an intent, hit Begin, hear the live composer drive the
 * five-layer engine. Per-layer solo/mute. Live composer state +
 * engine parameters polled every 250 ms while running.
 */

import { useEffect, useRef, useState } from "react";
import {
  AudioEngine,
  DEFAULT_LAYER_GAINS,
  type ComposerSeed,
  type LayerName,
  type LiveParams,
} from "@/components/audio/AudioEngine";
import { Composer, type ComposerLiveState } from "@/lib/composer";
import { INTENTS, type IntentDefinition } from "@/lib/intent";

const LAYER_LABELS: Record<LayerName, string> = {
  binaural: "Binaural",
  drone: "Drone",
  harmonic: "Solfeggio",
  schumann: "Schumann",
};

type LayerState = { muted: boolean; soloed: boolean };

export default function AudioHarness() {
  const [intent, setIntent] = useState<IntentDefinition>(INTENTS[1]);
  const [running, setRunning] = useState(false);
  const [seed, setSeed] = useState<ComposerSeed | null>(null);
  const [composerState, setComposerState] = useState<ComposerLiveState | null>(null);
  const [liveParams, setLiveParams] = useState<LiveParams | null>(null);
  const [layerState, setLayerState] = useState<Record<LayerName, LayerState>>({
    binaural: { muted: false, soloed: false },
    drone: { muted: false, soloed: false },
    harmonic: { muted: false, soloed: false },
    schumann: { muted: false, soloed: false },
  });
  const engineRef = useRef<AudioEngine | null>(null);
  const composerRef = useRef<Composer | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
      engineRef.current?.dispose();
    };
  }, []);

  const begin = async () => {
    if (running) return;
    const e = new AudioEngine();
    await e.unlock();
    const s = e.start({ intent });
    engineRef.current = e;
    composerRef.current = new Composer(e, intent, s.droneHz);
    setSeed(s);
    setRunning(true);
    pollRef.current = window.setInterval(() => {
      setComposerState(composerRef.current?.getLiveState() ?? null);
      setLiveParams(engineRef.current?.getLiveParams() ?? null);
    }, 250);
  };

  const end = async () => {
    if (!engineRef.current) return;
    await engineRef.current.stop(3);
    engineRef.current = null;
    composerRef.current = null;
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setRunning(false);
    setComposerState(null);
    setLiveParams(null);
  };

  const applyLayerStates = (next: Record<LayerName, LayerState>) => {
    if (!engineRef.current) return;
    const anySoloed = (Object.values(next) as LayerState[]).some((s) => s.soloed);
    (Object.keys(next) as LayerName[]).forEach((key) => {
      const s = next[key];
      const audible = anySoloed ? s.soloed && !s.muted : !s.muted;
      engineRef.current?.overrideLayer(key, audible ? null : 0);
    });
  };

  const toggleMute = (layer: LayerName) => {
    setLayerState((prev) => {
      const next: Record<LayerName, LayerState> = {
        ...prev,
        [layer]: { ...prev[layer], muted: !prev[layer].muted },
      };
      applyLayerStates(next);
      return next;
    });
  };

  const toggleSolo = (layer: LayerName) => {
    setLayerState((prev) => {
      const next: Record<LayerName, LayerState> = {
        ...prev,
        [layer]: { ...prev[layer], soloed: !prev[layer].soloed },
      };
      applyLayerStates(next);
      return next;
    });
  };

  return (
    <main className="min-h-[100dvh] w-screen bg-chamber p-6 text-lunar-silver">
      <div className="mx-auto max-w-2xl space-y-6 font-sans text-sm">
        <header>
          <h1 className="text-lg font-semibold text-pineal-gold">Audio harness</h1>
          <p className="mt-1 text-xs text-lunar-silver/65">
            Five-layer composer (binaural · drone · solfeggio · Schumann harmonics ·
            silence windows). Headphones recommended.
          </p>
        </header>

        <section>
          <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-lunar-silver/55">Intent</div>
          <div className="flex flex-wrap gap-2">
            {INTENTS.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => setIntent(i)}
                disabled={running}
                className="rounded-full border border-lunar-silver/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] disabled:opacity-50 data-[active=true]:border-pineal-gold data-[active=true]:text-pineal-gold"
                data-active={i.id === intent.id}
              >
                {i.label.en}
              </button>
            ))}
          </div>
        </section>

        <section className="flex gap-3">
          {!running ? (
            <button
              type="button"
              onClick={begin}
              className="rounded-full bg-pineal-gold px-5 py-2 text-[11px] uppercase tracking-[0.3em] text-indigo-deep"
            >
              Begin
            </button>
          ) : (
            <button
              type="button"
              onClick={end}
              className="rounded-full border border-lunar-silver/40 px-5 py-2 text-[11px] uppercase tracking-[0.3em]"
            >
              End
            </button>
          )}
        </section>

        {running ? (
          <section>
            <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-lunar-silver/55">Layer mix</div>
            <table className="w-full text-[11px]">
              <thead className="text-lunar-silver/55">
                <tr>
                  <th className="text-left">Layer</th>
                  <th className="text-right">Default</th>
                  <th className="text-right">Live</th>
                  <th className="text-center">Mute</th>
                  <th className="text-center">Solo</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(LAYER_LABELS) as LayerName[]).map((layer) => {
                  const live = liveParams
                    ? layer === "binaural"
                      ? liveParams.binauralGain
                      : layer === "drone"
                        ? liveParams.droneGain
                        : layer === "harmonic"
                          ? liveParams.harmonicGain
                          : liveParams.schumannGain
                    : 0;
                  return (
                    <tr key={layer} className="border-t border-lunar-silver/10">
                      <td className="py-1 font-mono">{LAYER_LABELS[layer]}</td>
                      <td className="py-1 text-right font-mono text-lunar-silver/55">
                        {DEFAULT_LAYER_GAINS[layer].toFixed(2)}
                      </td>
                      <td className="py-1 text-right font-mono">{live.toFixed(2)}</td>
                      <td className="py-1 text-center">
                        <input
                          type="checkbox"
                          checked={layerState[layer].muted}
                          onChange={() => toggleMute(layer)}
                        />
                      </td>
                      <td className="py-1 text-center">
                        <input
                          type="checkbox"
                          checked={layerState[layer].soloed}
                          onChange={() => toggleSolo(layer)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ) : null}

        {composerState && liveParams ? (
          <section className="rounded-2xl bg-indigo-deep/60 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-pineal-gold">Composer · live</div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] font-mono">
              <Row k="drone target">{composerState.targetDroneHz.toFixed(1)} Hz</Row>
              <Row k="voice steering">{composerState.voiceSteering ? "yes" : "no"}</Row>
              <Row k="last voice F0">
                {composerState.lastVoiceF0 != null
                  ? `${composerState.lastVoiceF0.toFixed(1)} Hz`
                  : "—"}
              </Row>
              <Row k="swell ×">{composerState.swellMultiplier.toFixed(2)}</Row>
              <Row k="silence interval">{composerState.silenceIntervalSec} s</Row>
              <Row k="silence duration">{composerState.silenceDurationSec} s</Row>
              <Row k="last silence">
                {liveParams.lastSilenceAt != null
                  ? `${Math.round((Date.now() - liveParams.lastSilenceAt) / 1000)} s ago`
                  : "—"}
              </Row>
            </dl>
          </section>
        ) : null}

        {seed ? (
          <details className="rounded-2xl bg-black/40 p-3 text-[11px] text-lunar-silver/80">
            <summary className="cursor-pointer text-lunar-silver/65">Initial composer seed</summary>
            <pre className="mt-2 select-text overflow-auto">{JSON.stringify(seed, null, 2)}</pre>
          </details>
        ) : null}
      </div>
    </main>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-lunar-silver/55">{k}</dt>
      <dd className="text-lunar-silver">{children}</dd>
    </>
  );
}
