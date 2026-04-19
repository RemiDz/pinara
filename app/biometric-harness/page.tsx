"use client";

/**
 * /biometric-harness — Phase 2.1.
 *
 * Live HRV + breath + voice F0 + posture. Coherence + depth derived
 * from the streams via CoherenceLoop. Phase 2.2 will add face mesh
 * + eye + pupil panels, plus the meditation-state classifier.
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

  const showMediaSection =
    bio.capabilities.hasMediaDevices || bio.capabilities.deviceMotion;

  return (
    <main className="min-h-[100dvh] bg-chamber p-6 text-lunar-silver">
      <div className="mx-auto max-w-3xl space-y-6 font-sans">
        <header>
          <h1 className="text-lg font-semibold text-pineal-gold">
            {t("biometric.harness.title")}
          </h1>
          <p className="mt-1 text-xs text-lunar-silver/60">
            {t("biometric.harness.subtitle")}
          </p>
        </header>

        <FusionPanel />

        {!showMediaSection ? (
          <p className="select-text rounded-2xl bg-indigo-deep/60 p-4 text-sm text-lunar-silver/85">
            {t("biometric.harness.no_media")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {bio.capabilities.hasMediaDevices ? <HRVPanel /> : null}
            {bio.capabilities.hasMediaDevices ? <BreathPanel /> : null}
            {bio.capabilities.hasMediaDevices ? <VoicePanel /> : null}
            <PosturePanel />
          </div>
        )}
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
    <Panel
      title={t("biometric.hrv.label")}
      quality={bio.hrv?.signalQuality ?? 0}
    >
      <BigNumber value={bio.hrv?.bpm ?? "—"} unit={t("biometric.hrv.bpm")} />
      <canvas
        ref={traceRef}
        width={400}
        height={48}
        className="mt-3 h-12 w-full rounded bg-black/40"
      />
      <Caption>
        {status === "running" && (bio.hrv?.bpm ?? null) === null
          ? t("biometric.hrv.calibrating")
          : status === "running"
            ? t("biometric.hrv.no_signal")
            : ""}
      </Caption>
      <ButtonRow>
        {status === "running" ? (
          <SecondaryButton onClick={() => bio.stopCamera()}>
            {t("biometric.stop")}
          </SecondaryButton>
        ) : (
          <PrimaryButton
            disabled={status === "starting"}
            onClick={() => void bio.startCamera()}
          >
            {status === "starting" ? "…" : t("biometric.start_camera")}
          </PrimaryButton>
        )}
      </ButtonRow>
      {status === "denied" ? (
        <Hint>{t("permission.camera.prompt")}</Hint>
      ) : null}
    </Panel>
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
    <Panel
      title={t("biometric.breath.label")}
      quality={bio.breath?.signalQuality ?? 0}
    >
      <BigNumber value={bio.breath?.bpm ?? "—"} unit={t("biometric.breath.bpm")} />
      <canvas
        ref={traceRef}
        width={400}
        height={48}
        className="mt-3 h-12 w-full rounded bg-black/40"
      />
      <Caption>
        {status === "running" && (bio.breath?.bpm ?? null) === null
          ? t("biometric.breath.calibrating")
          : status === "running"
            ? t("biometric.breath.no_signal")
            : ""}
      </Caption>
      <ButtonRow>
        {status === "running" ? (
          <SecondaryButton onClick={() => bio.stopMic()}>
            {t("biometric.stop")}
          </SecondaryButton>
        ) : (
          <PrimaryButton
            disabled={status === "starting"}
            onClick={() => void bio.startMic()}
          >
            {status === "starting" ? "…" : t("biometric.start_mic")}
          </PrimaryButton>
        )}
      </ButtonRow>
      {status === "denied" ? (
        <Hint>{t("permission.microphone.prompt")}</Hint>
      ) : null}
    </Panel>
  );
}

function VoicePanel() {
  const { t } = useI18n();
  const bio = useBiometrics();
  const traceRef = useRef<HTMLCanvasElement | null>(null);
  const samplesRef = useRef<number[]>([]);

  useEffect(() => {
    if (!bio?.voice) return;
    samplesRef.current.push(bio.voice.envelopeSample);
    if (samplesRef.current.length > 240) samplesRef.current.shift();
    drawTrace(traceRef.current, samplesRef.current, "#94C0E8");
  }, [bio?.voice]);

  if (!bio) return null;

  // Voice shares the mic stream. The Begin button is on the breath
  // panel; this panel is read-only in Phase 2.1.
  const f0 = bio.voice?.f0 ?? null;
  const active = bio.voice?.voiceActive ?? false;
  const status = bio.micStatus;
  return (
    <Panel title={t("biometric.voice.label")} quality={bio.voice?.signalQuality ?? 0}>
      <BigNumber
        value={f0 != null ? f0.toFixed(1) : "—"}
        unit={t("biometric.voice.hz")}
      />
      <canvas
        ref={traceRef}
        width={400}
        height={48}
        className="mt-3 h-12 w-full rounded bg-black/40"
      />
      <Caption>
        {status !== "running"
          ? ""
          : active
            ? t("biometric.voice.active")
            : f0 == null
              ? t("biometric.voice.calibrating")
              : t("biometric.voice.silent")}
      </Caption>
    </Panel>
  );
}

function PosturePanel() {
  const { t } = useI18n();
  const bio = useBiometrics();
  if (!bio) return null;

  const status = bio.postureStatus;
  const reading = bio.posture;
  const orientationKey = `biometric.orientation.${reading?.orientation ?? "unknown"}`;
  return (
    <Panel
      title={t("biometric.posture.label")}
      quality={reading?.stillness ?? 0}
    >
      <div className="grid grid-cols-2 gap-3 text-center">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-lunar-silver/55">
            {t("biometric.posture.stillness")}
          </div>
          <div className="mt-1 font-oracle text-3xl text-pineal-gold">
            {reading ? Math.round(reading.stillness * 100) : "—"}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-lunar-silver/55">
            {t("biometric.posture.orientation")}
          </div>
          <div className="mt-1 font-oracle text-base text-lunar-silver">
            {t(orientationKey)}
          </div>
        </div>
      </div>
      <ButtonRow>
        {status === "unsupported" ? (
          <Hint>{t("biometric.posture.unsupported")}</Hint>
        ) : status === "running" ? (
          <SecondaryButton onClick={() => bio.stopPosture()}>
            {t("biometric.stop")}
          </SecondaryButton>
        ) : (
          <PrimaryButton
            disabled={status === "starting"}
            onClick={() => void bio.startPosture()}
          >
            {status === "starting" ? "…" : t("biometric.start_posture")}
          </PrimaryButton>
        )}
      </ButtonRow>
      {status === "denied" ? (
        <Hint>{t("permission.motion.prompt")}</Hint>
      ) : null}
    </Panel>
  );
}

// -------- shared panel chrome --------

function Panel({
  title,
  quality,
  children,
}: {
  title: string;
  quality: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-indigo-deep/60 p-4 backdrop-blur">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-pineal-gold">{title}</h2>
        <SignalDot quality={quality} />
      </header>
      {children}
    </section>
  );
}

function BigNumber({ value, unit }: { value: number | string; unit: string }) {
  return (
    <div className="text-center">
      <div className="font-oracle text-5xl text-lunar-silver">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-lunar-silver/55">
        {unit}
      </div>
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 min-h-[1.25em] text-[11px] text-lunar-silver/60">
      {children}
    </div>
  );
}

function ButtonRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 flex gap-2">{children}</div>;
}

function PrimaryButton({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-pineal-gold px-4 py-1 text-[11px] uppercase tracking-[0.2em] text-indigo-deep disabled:opacity-50"
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-lunar-silver/30 px-4 py-1 text-[11px] uppercase tracking-[0.2em]"
    >
      {children}
    </button>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-[11px] text-lunar-silver/60">{children}</p>
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
