"use client";

/**
 * /join/[roomCode] — participant pairing.
 *
 * Generates a WebRTC offer for the facilitator to paste into the
 * host UI; pastes the returned answer to complete the pairing. Once
 * connected, the device receives field broadcasts (tick / silence /
 * intent change) and pulses the gland accordingly.
 */

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { applyAnswer, createOffer, defaultIceServers, type FieldMessage } from "@/lib/webrtc";
import { I18nProvider } from "@/lib/i18n-react";
import { CosmicProvider } from "@/components/cosmic/CosmicContext";
import { GlandWebGL } from "@/components/gland/GlandWebGL";
import { INTENTS } from "@/lib/intent";

export default function JoinPage() {
  return (
    <I18nProvider locale="en">
      <CosmicProvider>
        <Inner />
      </CosmicProvider>
    </I18nProvider>
  );
}

function Inner() {
  const params = useParams<{ roomCode: string }>();
  const code = params?.roomCode ?? "";
  const [offer, setOffer] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [paired, setPaired] = useState(false);
  const [lastEvent, setLastEvent] = useState<FieldMessage | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);

  const generate = async () => {
    const pc = new RTCPeerConnection({ iceServers: defaultIceServers() });
    pcRef.current = pc;
    const channel = pc.createDataChannel("field", { ordered: true });
    channelRef.current = channel;
    channel.onopen = () => setPaired(true);
    channel.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as FieldMessage;
        setLastEvent(msg);
      } catch { /* */ }
    };
    const o = await createOffer(pc);
    setOffer(o);
  };

  const completePairing = async () => {
    if (!pcRef.current) return;
    await applyAnswer(pcRef.current, answerInput);
  };

  useEffect(() => {
    return () => {
      try { channelRef.current?.close(); pcRef.current?.close(); } catch { /* */ }
    };
  }, []);

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-chamber text-lunar-silver">
      <div className="absolute inset-0">
        <GlandWebGL intent={INTENTS[1]} intensity={1} inSession={paired} />
      </div>
      <div className="pointer-events-auto absolute inset-x-0 bottom-6 mx-auto max-w-md space-y-3 px-4 font-sans text-xs">
        <header className="rounded-2xl bg-indigo-deep/85 p-3 backdrop-blur">
          <div className="text-[10px] uppercase tracking-[0.3em] text-pineal-gold">Room {code}</div>
          <div className="mt-1 text-[11px] text-lunar-silver/70">
            {paired ? "Connected. The field will guide you." : "Awaiting facilitator pairing."}
          </div>
          {lastEvent ? (
            <div className="mt-1 font-mono text-[10px] text-lunar-silver/60">
              last: {lastEvent.kind}
            </div>
          ) : null}
        </header>

        {!offer ? (
          <button
            type="button"
            onClick={() => void generate()}
            className="block w-full rounded-full bg-pineal-gold px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-indigo-deep"
          >
            Generate join offer
          </button>
        ) : !paired ? (
          <details className="rounded-2xl bg-indigo-deep/85 p-3 text-[10px]">
            <summary className="cursor-pointer text-lunar-silver/65">Pairing details</summary>
            <p className="mt-2 text-lunar-silver/60">1. Send this to the facilitator:</p>
            <textarea
              className="mt-1 h-20 w-full rounded bg-black/40 p-2 font-mono text-[10px]"
              value={offer}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
            />
            <p className="mt-2 text-lunar-silver/60">2. Paste their answer here:</p>
            <textarea
              className="mt-1 h-20 w-full rounded bg-black/40 p-2 font-mono text-[10px]"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
            />
            <button
              type="button"
              onClick={() => void completePairing()}
              className="mt-2 rounded-full border border-pineal-gold/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-pineal-gold"
            >
              Complete pairing
            </button>
          </details>
        ) : null}
      </div>
    </main>
  );
}
