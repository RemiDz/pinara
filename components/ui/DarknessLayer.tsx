"use client";

/**
 * DarknessLayer — screen dim controller.
 *
 * After 60s of no touch, fade UI chrome and dim the gland's render
 * intensity to 20%. Tap restores for 10s. Wake Lock active while a
 * session is in progress.
 *
 * The OS-level Screen Brightness API does not exist on the open web;
 * we approximate by reducing render intensity and fading our own
 * chrome to true black. AmbientLightSensor (where available) is used
 * only to *suggest* the user dim the room, not to force anything.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n-react";

type Props = {
  /** Whether a session is active — Wake Lock acquired while true */
  active: boolean;
  /** 1 when chrome is fully visible, 0 when fully dimmed. Used by parent. */
  onIntensityChange: (intensity: number) => void;
};

const IDLE_MS = 60_000;
const WAKE_MS = 10_000;
const FADE_MS = 600;
const DIM_MIN = 0.2;

export function DarknessLayer({ active, onIntensityChange }: Props) {
  const { t } = useI18n();
  const [dimmed, setDimmed] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const idleTimerRef = useRef<number | null>(null);
  const wakeTimerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const dim = useCallback(() => {
    setDimmed(true);
    onIntensityChange(DIM_MIN);
    trackEvent("darkness_entered");
  }, [onIntensityChange]);

  const restartIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(dim, IDLE_MS);
  }, [dim]);

  const wake = useCallback(() => {
    setDimmed(false);
    onIntensityChange(1);
    trackEvent("darkness_exited");
    if (wakeTimerRef.current !== null) window.clearTimeout(wakeTimerRef.current);
    wakeTimerRef.current = window.setTimeout(() => {
      // After WAKE_MS, restart the idle countdown so dim re-engages.
      restartIdleTimer();
    }, WAKE_MS);
  }, [onIntensityChange, restartIdleTimer]);

  // Wake Lock — only while a session is active.
  useEffect(() => {
    let cancelled = false;
    async function acquire() {
      if (!("wakeLock" in navigator)) return;
      try {
        const sentinel = await (navigator as Navigator).wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
          return;
        }
        wakeLockRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      } catch {
        // Wake lock failures are silent; copy in CapabilityBanner already covers this.
      }
    }
    if (active) void acquire();
    return () => {
      cancelled = true;
      void wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [active]);

  // Idle timer + interaction listeners.
  useEffect(() => {
    const onInteract = () => {
      if (dimmed) wake();
      restartIdleTimer();
    };
    restartIdleTimer();
    window.addEventListener("pointerdown", onInteract, { passive: true });
    window.addEventListener("keydown", onInteract);
    document.addEventListener("visibilitychange", onInteract);
    return () => {
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
      if (wakeTimerRef.current !== null) window.clearTimeout(wakeTimerRef.current);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      document.removeEventListener("visibilitychange", onInteract);
    };
  }, [dimmed, restartIdleTimer, wake]);

  // Ambient light suggestion — once per mount only, no nagging.
  useEffect(() => {
    if (!("AmbientLightSensor" in window)) return;
    let suggested = false;
    type ALSCtor = new (opts?: { frequency?: number }) => EventTarget & {
      illuminance?: number;
      start(): void;
      stop(): void;
    };
    const Ctor = (window as unknown as { AmbientLightSensor?: ALSCtor }).AmbientLightSensor;
    if (!Ctor) return;
    try {
      const sensor = new Ctor({ frequency: 0.5 });
      const onReading = () => {
        if (suggested) return;
        if (typeof sensor.illuminance === "number" && sensor.illuminance > 60) {
          suggested = true;
          setShowSuggestion(true);
          window.setTimeout(() => setShowSuggestion(false), 6000);
        }
      };
      sensor.addEventListener("reading", onReading);
      sensor.start();
      return () => {
        sensor.stop();
        sensor.removeEventListener("reading", onReading);
      };
    } catch {
      // Permission denied or sensor blocked — quiet.
    }
  }, []);

  return (
    <div
      aria-hidden={!showSuggestion}
      className="pointer-events-none fixed inset-0 z-30 flex items-end justify-center pb-20 transition-opacity ease-breathe"
      style={{
        opacity: showSuggestion ? 1 : 0,
        transitionDuration: `${FADE_MS}ms`,
      }}
    >
      <p className="select-text rounded-full bg-black/70 px-4 py-2 font-sans text-xs text-lunar-silver/90 backdrop-blur">
        {t("darkness.suggest")}
      </p>
    </div>
  );
}
