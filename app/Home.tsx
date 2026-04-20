"use client";

/**
 * Home — main gland interface. Used by both `/` (English) and `/lt`
 * (Lithuanian mirror) so the locale arrives as a prop.
 *
 * State flow:
 *   idle → choosing intent → preparing audio → running → ending → complete
 *
 * No tabs, no menus on this surface. The gland is the app.
 */

import { useEffect, useMemo, useState } from "react";
import { CosmicProvider, useCosmic } from "@/components/cosmic/CosmicContext";
import { BiometricProvider } from "@/components/biometrics/BiometricContext";
import { I18nProvider, useI18n } from "@/lib/i18n-react";
import { GlandContainer } from "@/components/gland/GlandContainer";
import { StratumIndicator } from "@/components/ui/StratumIndicator";
import { Echo } from "@/components/ui/Echo";
import { IntentSelector } from "@/components/session/IntentSelector";
import { useSessionController } from "@/components/session/SessionController";
import { DarknessLayer } from "@/components/ui/DarknessLayer";
import { CapabilityBanner } from "@/components/ui/CapabilityBanner";
import {
  INTENTS,
  SESSION_LENGTHS,
  type IntentDefinition,
  type IntentId,
  type SessionLengthMin,
} from "@/lib/intent";
import {
  getPreferences,
  setPreferences,
} from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

type Phase = "idle" | "choosing" | "running" | "complete";

function Inner() {
  const { t, locale } = useI18n();
  const cosmic = useCosmic();
  const session = useSessionController();

  const [phase, setPhase] = useState<Phase>("idle");
  const [selected, setSelected] = useState<IntentDefinition | null>(null);
  const [length, setLength] = useState<SessionLengthMin>(22);
  const [intensity, setIntensity] = useState<number>(1);

  // Restore last intent preference.
  useEffect(() => {
    const prefs = getPreferences();
    if (prefs.lastIntent) {
      const found = INTENTS.find((i) => i.id === prefs.lastIntent);
      if (found) setSelected(found);
    }
    setLength(prefs.defaultLengthMin as SessionLengthMin);
  }, []);

  // Reflect session phase into our local stage machine.
  useEffect(() => {
    if (session.state.status === "complete") {
      setPhase("complete");
      const id = window.setTimeout(() => setPhase("idle"), 4000);
      return () => window.clearTimeout(id);
    }
    if (session.state.status === "running" || session.state.status === "preparing") {
      setPhase("running");
    }
  }, [session.state.status]);

  const handleIntentSelect = (intent: IntentDefinition) => {
    setSelected(intent);
    setPreferences({ lastIntent: intent.id as IntentId });
    trackEvent("intent_chosen", { intent: intent.id });
  };

  const handleBegin = async () => {
    if (!selected) return;
    await session.start(selected, length);
  };

  const headlineKey = useMemo<string>(() => {
    if (phase === "running") return "session.tap_to_begin"; // hidden during running anyway
    if (phase === "complete") return "session.end";
    return "session.tap_to_begin";
  }, [phase]);

  const activeIntent = selected ?? INTENTS[1]; // default to "Open" while choosing

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-chamber text-lunar-silver">
      <div className="absolute inset-0">
        <GlandContainer
          intent={activeIntent}
          intensity={intensity}
          inSession={phase === "running"}
        />
      </div>

      {/* Cosmic readout — top-left, very quiet */}
      <div
        className="pointer-events-none absolute left-4 top-4 select-text font-sans text-[11px] uppercase tracking-[0.25em] text-lunar-silver/60"
        style={{ opacity: intensity * 0.7 }}
      >
        {cosmic.planetaryHour
          ? `${t("cosmic.planetary_hour")} · ${t(`planet.${cosmic.planetaryHour.planet}`)}`
          : t("cosmic.refreshing")}
        {cosmic.moonPhase ? (
          <>
            <br />
            {t("cosmic.moon_phase")} · {t(`moon.${cosmic.moonPhase.phaseName}`)}
          </>
        ) : null}
        {cosmic.schumann ? (
          <>
            <br />
            {t("cosmic.schumann")} · {cosmic.schumann.fundamentalHz.toFixed(2)} Hz · Kp {cosmic.schumann.kp.toFixed(1)}
          </>
        ) : null}
      </div>

      {/* Idle / choosing — radial intent picker around the gland */}
      {phase !== "running" ? (
        <IntentSelector
          selected={selected?.id ?? null}
          onSelect={handleIntentSelect}
        />
      ) : null}

      {/* Length selector + Begin — appear once an intent is chosen */}
      {phase !== "running" && selected ? (
        <div className="pointer-events-auto absolute bottom-16 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
          <div className="flex gap-2">
            {SESSION_LENGTHS.free.map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => setLength(len as SessionLengthMin)}
                className="rounded-full border border-lunar-silver/30 px-3 py-1 font-sans text-[11px] uppercase tracking-[0.2em] text-lunar-silver/85 transition-colors duration-breathe ease-breathe data-[active=true]:border-pineal-gold data-[active=true]:text-pineal-gold"
                data-active={length === len}
              >
                {t(`session.length.${len}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleBegin}
            className="rounded-full bg-pineal-gold px-6 py-2 font-sans text-xs uppercase tracking-[0.3em] text-indigo-deep transition-transform duration-breathe ease-breathe hover:scale-[1.02]"
          >
            {t("session.start")}
          </button>
        </div>
      ) : null}

      {/* Running — tap-to-end at bottom, very subtle */}
      {phase === "running" ? (
        <div className="pointer-events-auto absolute bottom-10 left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={() => session.stop()}
            className="rounded-full border border-lunar-silver/20 px-5 py-1 font-sans text-[10px] uppercase tracking-[0.3em] text-lunar-silver/60 transition-colors duration-breathe ease-breathe hover:text-lunar-silver"
            style={{ opacity: intensity * 0.7 }}
          >
            {t("session.end")}
          </button>
        </div>
      ) : null}

      {/* Complete — quiet acknowledgement */}
      {phase === "complete" ? (
        <p className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 select-text font-oracle text-base text-pineal-gold/85">
          {headlineKey ? t("session.end") : null}
        </p>
      ) : null}

      {/* Stratum indicator — top right */}
      <div className="pointer-events-none absolute right-4 top-4">
        <StratumIndicator />
      </div>

      {/* Language switch — bottom right */}
      <a
        href={locale === "en" ? "/lt" : "/"}
        className="absolute bottom-3 right-3 select-text font-sans text-[10px] uppercase tracking-[0.3em] text-lunar-silver/50 hover:text-lunar-silver/80"
      >
        {t("footer.lang_switch")}
      </a>

      <Echo />
      <CapabilityBanner />
      <DarknessLayer active={phase === "running"} onIntensityChange={setIntensity} />
    </main>
  );
}

export function Home({ locale }: { locale: Locale }) {
  // Reflect locale into the document for screen readers / styling hooks.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return (
    <I18nProvider locale={locale}>
      <CosmicProvider>
        <BiometricProvider>
          <Inner />
        </BiometricProvider>
      </CosmicProvider>
    </I18nProvider>
  );
}
