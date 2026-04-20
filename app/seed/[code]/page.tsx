"use client";

/**
 * /seed/[code] — at-home journey seeded by a previous ceremony.
 *
 * The seed code encodes the intent + length + start day so the
 * client can run a 7- or 21-day series tuned to that ceremony.
 * Format: <intentId>-<lengthMin>-<days>-<isoDate>
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { I18nProvider, useI18n } from "@/lib/i18n-react";
import { CosmicProvider } from "@/components/cosmic/CosmicContext";
import { BiometricProvider } from "@/components/biometrics/BiometricContext";
import { Home } from "../../Home";
import { INTENTS, type IntentDefinition, SESSION_LENGTHS } from "@/lib/intent";

type SeedPlan = {
  intent: IntentDefinition;
  lengthMin: 11 | 22 | 33;
  totalDays: number;
  startedAt: Date;
  /** Day number 1..totalDays, or null if expired */
  currentDay: number | null;
};

function parseSeed(code: string): SeedPlan | null {
  const parts = code.split("-");
  if (parts.length < 4) return null;
  const [intentId, lenStr, daysStr, ...isoParts] = parts;
  const len = Number(lenStr);
  const days = Number(daysStr);
  const startedAt = new Date(isoParts.join("-"));
  const intent = INTENTS.find((i) => i.id === intentId);
  if (!intent || isNaN(startedAt.getTime())) return null;
  if (!(SESSION_LENGTHS.free as readonly number[]).includes(len)) return null;
  const dayNum = Math.floor((Date.now() - startedAt.getTime()) / 86_400_000) + 1;
  const currentDay = dayNum >= 1 && dayNum <= days ? dayNum : null;
  return { intent, lengthMin: len as 11 | 22 | 33, totalDays: days, startedAt, currentDay };
}

export default function SeedPage() {
  const params = useParams<{ code: string }>();
  const code = params?.code ?? "";
  const [plan, setPlan] = useState<SeedPlan | null | "invalid">(null);

  useEffect(() => {
    if (!code) return;
    const decoded = decodeURIComponent(code);
    setPlan(parseSeed(decoded) ?? "invalid");
  }, [code]);

  if (plan === null) {
    return (
      <I18nProvider locale="en">
        <main className="min-h-[100dvh] bg-chamber p-6 text-lunar-silver"><p className="font-sans text-sm">Decoding seed…</p></main>
      </I18nProvider>
    );
  }

  if (plan === "invalid") {
    return (
      <I18nProvider locale="en">
        <SeedNotice title="The field is quiet." body="This seed could not be decoded. Ask your facilitator for a new one." />
      </I18nProvider>
    );
  }

  if (plan.currentDay === null) {
    return (
      <I18nProvider locale="en">
        <SeedNotice title="The journey is complete." body={`This ${plan.totalDays}-day journey has finished. Begin a new one with your facilitator.`} />
      </I18nProvider>
    );
  }

  // Otherwise drop the user into a normal session pre-tuned to the seed's intent.
  return (
    <I18nProvider locale="en">
      <CosmicProvider>
        <BiometricProvider>
          <SeedHeader day={plan.currentDay} of={plan.totalDays} intent={plan.intent} />
          <Home locale="en" />
        </BiometricProvider>
      </CosmicProvider>
    </I18nProvider>
  );
}

function SeedHeader({ day, of, intent }: { day: number; of: number; intent: IntentDefinition }) {
  return (
    <div className="pointer-events-none fixed left-4 top-12 z-40 select-text font-sans text-[10px] uppercase tracking-[0.25em] text-pineal-gold/85">
      Day {day} / {of} · {intent.label.en}
    </div>
  );
}

function SeedNotice({ title, body }: { title: string; body: string }) {
  const { t } = useI18n();
  return (
    <main className="min-h-[100dvh] bg-chamber p-6 text-lunar-silver">
      <div className="mx-auto max-w-md space-y-4 pt-32 text-center font-sans">
        <h1 className="font-oracle text-3xl text-pineal-gold">{title}</h1>
        <p className="select-text text-sm text-lunar-silver/80">{body}</p>
        <a href="/" className="inline-block text-xs uppercase tracking-[0.3em] text-lunar-silver/60 hover:text-lunar-silver">
          {t("session.tap_to_begin")}
        </a>
      </div>
    </main>
  );
}
