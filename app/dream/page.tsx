"use client";

/**
 * /dream — Phase 7. Dream journal route. Strata-gated to Stratum 4+
 * in production; gate currently advisory.
 */

import { I18nProvider } from "@/lib/i18n-react";
import { DreamJournal } from "@/components/oracle/DreamJournal";

export default function DreamPage() {
  return (
    <I18nProvider locale="en">
      <main className="min-h-[100dvh] bg-chamber p-6 text-lunar-silver">
        <div className="mx-auto max-w-lg space-y-4 font-sans">
          <h1 className="font-oracle text-2xl text-pineal-gold">Dream journal</h1>
          <p className="text-xs text-lunar-silver/65">
            Speak the dream as you remember it. Audio is never written
            to disk; transcripts stay in this browser.
          </p>
          <DreamJournal />
          <a href="/" className="inline-block text-xs uppercase tracking-[0.3em] text-lunar-silver/60 hover:text-lunar-silver">
            Back to the chamber
          </a>
        </div>
      </main>
    </I18nProvider>
  );
}
