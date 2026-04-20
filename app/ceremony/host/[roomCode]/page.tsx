"use client";

/**
 * /ceremony/host/[roomCode] — facilitator host. Accepts WebRTC
 * offers pasted from each participant device, returns the answer to
 * paste back. A real-time relay (Phase 6.1) replaces this with
 * automatic pairing.
 */

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { acceptOffer, defaultIceServers, type FieldMessage } from "@/lib/webrtc";
import { SessionReportButton, type SessionReportInput } from "@/components/practitioner/SessionReport";

type Peer = {
  id: string;
  pc: RTCPeerConnection;
  channel: RTCDataChannel | null;
  joinedAt: number;
};

export default function HostPage() {
  const params = useParams<{ roomCode: string }>();
  const code = params?.roomCode ?? "";
  const [offerInput, setOfferInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [peers, setPeers] = useState<{ id: string; joinedAt: number }[]>([]);
  const peersRef = useRef<Peer[]>([]);
  const startedAt = useRef<number>(Date.now());

  const acceptParticipant = async () => {
    setBusy(true);
    setAnswer("");
    try {
      const pc = new RTCPeerConnection({ iceServers: defaultIceServers() });
      const id = `p${peersRef.current.length + 1}`;
      const peer: Peer = { id, pc, channel: null, joinedAt: Date.now() };
      pc.ondatachannel = (e) => {
        peer.channel = e.channel;
        e.channel.onopen = () => {
          setPeers([...peersRef.current.map((p) => ({ id: p.id, joinedAt: p.joinedAt }))]);
        };
        e.channel.onmessage = (msg) => {
          // Phase 6.1+: process telemetry from participants.
          void msg;
        };
      };
      const ans = await acceptOffer(pc, offerInput);
      setAnswer(ans);
      peersRef.current.push(peer);
      setPeers(peersRef.current.map((p) => ({ id: p.id, joinedAt: p.joinedAt })));
    } catch (err) {
      console.error("accept offer failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const broadcast = (msg: FieldMessage) => {
    const text = JSON.stringify(msg);
    peersRef.current.forEach((p) => {
      try { p.channel?.send(text); } catch { /* */ }
    });
  };

  const sendTick = () => broadcast({ kind: "tick", t: Date.now() });
  const sendSilence = () => broadcast({ kind: "silence", durationSec: 4, at: Date.now() });

  useEffect(() => {
    const peerList = peersRef;
    return () => {
      peerList.current.forEach((p) => { try { p.channel?.close(); p.pc.close(); } catch { /* */ } });
    };
  }, []);

  const reportInput: SessionReportInput = {
    intent: "ceremony",
    durationMin: Math.round((Date.now() - startedAt.current) / 60000),
    startedAt: startedAt.current,
    endedAt: Date.now(),
    participantCount: peers.length,
  };

  return (
    <main className="min-h-[100dvh] bg-chamber p-6 text-lunar-silver">
      <div className="mx-auto max-w-3xl space-y-6 font-sans text-sm">
        <header>
          <h1 className="font-oracle text-3xl text-pineal-gold">Host · {code}</h1>
          <p className="mt-1 text-xs text-lunar-silver/60">
            {peers.length} participant{peers.length === 1 ? "" : "s"} connected.
          </p>
        </header>

        <section className="rounded-2xl bg-indigo-deep/60 p-4">
          <h2 className="text-xs uppercase tracking-[0.25em] text-pineal-gold">Add a participant</h2>
          <p className="mt-1 text-[11px] text-lunar-silver/65">
            Ask them to open <span className="font-mono">/join/{code}</span> on
            their phone, copy the offer, and paste it here.
          </p>
          <textarea
            className="mt-3 h-24 w-full rounded bg-black/40 p-2 font-mono text-[11px]"
            placeholder="Paste participant offer JSON…"
            value={offerInput}
            onChange={(e) => setOfferInput(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void acceptParticipant()}
              disabled={busy || !offerInput.trim()}
              className="rounded-full bg-pineal-gold px-4 py-1 text-[11px] uppercase tracking-[0.2em] text-indigo-deep disabled:opacity-50"
            >
              {busy ? "…" : "Accept"}
            </button>
          </div>
          {answer ? (
            <>
              <h3 className="mt-3 text-[11px] uppercase tracking-[0.25em] text-pineal-gold">
                Send this back
              </h3>
              <textarea
                className="mt-1 h-24 w-full rounded bg-black/40 p-2 font-mono text-[11px]"
                value={answer}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
              />
            </>
          ) : null}
        </section>

        <section className="rounded-2xl bg-indigo-deep/60 p-4">
          <h2 className="text-xs uppercase tracking-[0.25em] text-pineal-gold">Field broadcast</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={sendTick}
              className="rounded-full border border-lunar-silver/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
            >
              Tick
            </button>
            <button
              type="button"
              onClick={sendSilence}
              className="rounded-full border border-lunar-silver/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
            >
              Silence
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-indigo-deep/60 p-4">
          <h2 className="text-xs uppercase tracking-[0.25em] text-pineal-gold">Ceremony report</h2>
          <p className="mt-1 text-[11px] text-lunar-silver/65">
            PDF includes participant count, duration, and any captured peaks.
          </p>
          <div className="mt-2"><SessionReportButton input={reportInput} /></div>
        </section>
      </div>
    </main>
  );
}
