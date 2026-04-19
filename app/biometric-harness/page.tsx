"use client";

/**
 * /biometric-harness — Phase 2.0 functional version.
 *
 * Real permission prompts for camera + mic. Live HRV + breath
 * readouts. Coherence + depth scores derived from CoherenceLoop.
 * Phase 2.1 will add voice F0 and the rest of the streams.
 */

import { useEffect, useRef } from "react";
import {
  BiometricProvider,
  useBiometrics,
} from "@/components/biometrics/BiometricContext";
import { I18nProvider, useI18n } from "@/lib/i18n-react";

export default function BiometricHarness() {
  return (
    <I18nProvider locale="en">
      <BiometricProvider>
        <Inner />
      </BiometricProvider>
    </I18nProvider>
  );
}

function Inner() {
  const { t } = useI18n();
  const bio = useBiometrics();

  if (!bio) return null;

  if (!bio.capabilities) {
    return (
      <main className="min-h-[100dvh] bg-chamber p-6 text-lunar-silver">
        <p className="font-sans text-sm text-lunar-silver/70">Detecting…</p>
      </main>
    );
  }

  if (!bio.capabilities.hasMediaDevices) {
    return (
      <main className="min-h-[100dvh] bg-chamber p-6 text-lunar-silver">
        <div className="mx-auto max-w-md font-sans text-sm">
          <h1 className="mb-3 text-lg font-semibold text-pineal-gold">
            {t("biometric.harness.title")}
          </h1>
          <p className="select-text text-lunar-silver/80">
            {t("biometric.harness.no_media")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-chamber p-6 text-lunar-silver">
      <div className="mx-auto max-w-2xl space-y-6 font-sans">
        <header>
          <h1 className="text-lg font-semibold text-pineal-gold">
            {t("biometric.harness.title")}
          </h1>
          <p className="mt-1 text-xs text-lunar-silver/60">
            {t("biometric.harness.subtitle")}
          </p>
        </header>

        <FusionPanel />

        <div className="grid gap-4 sm:grid-cols-2">
          <HRVPanel />
          <BreathPanel />
        </div>
      </div>
    </main>
  );
}

function FusionPanel() {
  const { t } = useI18n();
  const bio = useBiometrics();
  if (!bio) return null;
  return (
    <div className="rounded-2xl bg-indigo-deep/60 p-5 backdrop-blur">
      <div className="grid grid-cols-2 gap-4">
        <Metric label={t("biometric.coherence")} value={bio.coherence.coherence} />
        <Metric label={t("biometric.depth")} value={bio.coherence.depth} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-[0.25em] text-lunar-silver/55">
        {label}
      </div>
      <div className="mt-1 font-oracle text-4xl text-pineal-gold">{value}</div>
    </div>
  );
}

function HRVPanel() {
  const { t } = useI18n();
  const bio = useBiometrics();
  const traceRef = useRef<HTMLCanvasElement | null>(null);
  const samplesRef = useRef<number[]>([]);

  useEffect(() => {
    if (!bio?.hrv) return;
    samplesRef.current.push(bio.hrv.envelopeSample);
    if (samplesRef.current.length > 240) samplesRef.current.shift();
    drawTrace(traceRef.current, samplesRef.current, "#E8B86D");
  }, [bio?.hrv]);

  if (!bio) return null;

  const status = bio.cameraStatus;
  return (
    <section className="rounded-2xl bg-indigo-deep/60 p-4 backdrop-blur">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-pineal-gold">
          {t("biometric.hrv.label")}
        </h2>
        <SignalDot quality={bio.hrv?.signalQuality ?? 0} />
      </header>

      <div className="text-center">
        <div className="font-oracle text-5xl text-lunar-silver">
          {bio.hrv?.bpm ?? "—"}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-lunar-silver/55">
          {t("biometric.hrv.bpm")}
        </div>
      </div>

      <canvas
        ref={traceRef}
        width={400}
        height={48}
        className="mt-3 h-12 w-full rounded bg-black/40"
      />

      <div className="mt-3 min-h-[1.25em] text-[11px] text-lunar-silver/60">
        {status === "running" && (bio.hrv?.bpm ?? null) === null
          ? t("biometric.hrv.calibrating")
          : status === "running"
            ? t("biometric.hrv.no_signal")
            : null}
      </div>

      <div className="mt-2 flex gap-2">
        {status === "running" ? (
          <button
            type="button"
            onClick={() => bio.stopCamera()}
            className="rounded-full border border-lunar-silver/30 px-4 py-1 text-[11px] uppercase tracking-[0.2em]"
          >
            {t("biometric.stop")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void bio.startCamera()}
            className="rounded-full bg-pineal-gold px-4 py-1 text-[11px] uppercase tracking-[0.2em] text-indigo-deep"
            disabled={status === "starting"}
          >
            {status === "starting" ? "…" : t("biometric.start_camera")}
          </button>
        )}
      </div>

      {status === "denied" ? (
        <p className="mt-2 text-[11px] text-lunar-silver/60">
          {t("permission.camera.prompt")}
        </p>
      ) : null}
    </section>
  );
}

function BreathPanel() {
  const { t } = useI18n();
  const bio = useBiometrics();
  const traceRef = useRef<HTMLCanvasElement | null>(null);
  const samplesRef = useRef<number[]>([]);

  useEffect(() => {
    if (!bio?.breath) return;
    samplesRef.current.push(bio.breath.envelopeSample);
    if (samplesRef.current.length > 240) samplesRef.current.shift();
    drawTrace(traceRef.current, samplesRef.current, "#C094E8");
  }, [bio?.breath]);

  if (!bio) return null;

  const status = bio.micStatus;
  return (
    <section className="rounded-2xl bg-indigo-deep/60 p-4 backdrop-blur">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-pineal-gold">
          {t("biometric.breath.label")}
        </h2>
        <SignalDot quality={bio.breath?.signalQuality ?? 0} />
      </header>

      <div className="text-center">
        <div className="font-oracle text-5xl text-lunar-silver">
          {bio.breath?.bpm ?? "—"}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-lunar-silver/55">
          {t("biometric.breath.bpm")}
        </div>
      </div>

      <canvas
        ref={traceRef}
        width={400}
        height={48}
        className="mt-3 h-12 w-full rounded bg-black/40"
      />

      <div className="mt-3 min-h-[1.25em] text-[11px] text-lunar-silver/60">
        {status === "running" && (bio.breath?.bpm ?? null) === null
          ? t("biometric.breath.calibrating")
          : status === "running"
            ? t("biometric.breath.no_signal")
            : null}
      </div>

      <div className="mt-2 flex gap-2">
        {status === "running" ? (
          <button
            type="button"
            onClick={() => bio.stopMic()}
            className="rounded-full border border-lunar-silver/30 px-4 py-1 text-[11px] uppercase tracking-[0.2em]"
          >
            {t("biometric.stop")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void bio.startMic()}
            className="rounded-full bg-pineal-gold px-4 py-1 text-[11px] uppercase tracking-[0.2em] text-indigo-deep"
            disabled={status === "starting"}
          >
            {status === "starting" ? "…" : t("biometric.start_mic")}
          </button>
        )}
      </div>

      {status === "denied" ? (
        <p className="mt-2 text-[11px] text-lunar-silver/60">
          {t("permission.microphone.prompt")}
        </p>
      ) : null}
    </section>
  );
}

function SignalDot({ quality }: { quality: number }) {
  const colour =
    quality >= 0.7 ? "#7AC489" : quality >= 0.4 ? "#E8B86D" : "#5A6168";
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: colour }}
      aria-hidden
    />
  );
}

function drawTrace(canvas: HTMLCanvasElement | null, samples: number[], colour: string) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (samples.length < 2) return;
  let min = Infinity;
  let max = -Infinity;
  for (const s of samples) {
    if (s < min) min = s;
    if (s > max) max = s;
  }
  if (max - min < 1e-6) {
    min -= 0.5;
    max += 0.5;
  }
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < samples.length; i++) {
    const x = (i / (samples.length - 1)) * w;
    const y = h - ((samples[i] - min) / (max - min)) * (h - 4) - 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
