"use client";

/**
 * /gates — Phase 7. Cosmic gate calendar (moon phases + solar gates).
 * Reachable from a long-press on the home gland in Phase 7.1.
 */

import { I18nProvider, useI18n } from "@/lib/i18n-react";
import { GateCalendar } from "@/components/gates/GateCalendar";

export default function GatesPage() {
  return (
    <I18nProvider locale="en">
      <Inner />
    </I18nProvider>
  );
}

function Inner() {
  const { t } = useI18n();
  return (
    <main className="min-h-[100dvh] bg-chamber p-6 text-lunar-silver">
      <div className="mx-auto max-w-md space-y-4 font-sans">
        <h1 className="font-oracle text-2xl text-pineal-gold">{t("gates.title")}</h1>
        <GateCalendar />
        <a href="/" className="inline-block text-xs uppercase tracking-[0.3em] text-lunar-silver/60 hover:text-lunar-silver">
          Back to the chamber
        </a>
      </div>
    </main>
  );
}
