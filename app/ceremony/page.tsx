"use client";

/**
 * /ceremony — facilitator landing page.
 *
 * Generates a 6-character room code and offers two surfaces:
 *   • Continue here: tablet-optimised host UI for facilitator.
 *   • Join URL / QR: participant link that resolves to /join/[roomCode].
 *
 * Phase 6.0 uses URL-only signalling. The host UI accepts pasted
 * SDP answers from each participant for proper WebRTC pairing;
 * Phase 6.1 will replace this with an automatic relay.
 */

import { useEffect, useState } from "react";
import { generateRoomCode } from "@/lib/webrtc";

export default function CeremonyLanding() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    setCode(generateRoomCode());
  }, []);

  if (!code) {
    return (
      <main className="min-h-[100dvh] bg-chamber p-6 text-lunar-silver">
        <p className="font-sans text-sm">Preparing the chamber…</p>
      </main>
    );
  }

  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${code}`
    : `/join/${code}`;

  return (
    <main className="min-h-[100dvh] bg-chamber p-6 text-lunar-silver">
      <div className="mx-auto max-w-2xl space-y-6 font-sans">
        <header>
          <h1 className="font-oracle text-3xl text-pineal-gold">Ceremony</h1>
          <p className="mt-2 text-sm text-lunar-silver/70">
            A facilitator-led practice. Participants join from their phones.
            Their devices become field nodes — gland pulses, soft flashes at
            session peaks, and (with consent) a shared coherence reading.
          </p>
        </header>

        <section className="rounded-2xl bg-indigo-deep/60 p-5">
          <div className="text-[11px] uppercase tracking-[0.3em] text-lunar-silver/55">Room code</div>
          <div className="mt-2 select-text font-oracle text-5xl tracking-[0.4em] text-pineal-gold">{code}</div>
          <div className="mt-4 select-text font-mono text-xs text-lunar-silver/70 break-all">{joinUrl}</div>
        </section>

        <div className="flex flex-wrap gap-3">
          <a
            href={`/ceremony/host/${code}`}
            className="rounded-full bg-pineal-gold px-5 py-2 text-xs uppercase tracking-[0.3em] text-indigo-deep"
          >
            Open host
          </a>
          <a
            href={joinUrl}
            className="rounded-full border border-lunar-silver/30 px-5 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Open join (preview)
          </a>
        </div>

        <p className="text-[11px] text-lunar-silver/50">
          Phase 6.0 uses copy-paste signalling between the host and each
          participant. The host page guides you through the SDP exchange.
          Phase 6.1 will replace this with a relay so devices pair on a
          shared room code alone.
        </p>
      </div>
    </main>
  );
}
