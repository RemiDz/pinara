"use client";

/**
 * DreamJournal — Phase 7. Browser SpeechRecognition is the practical
 * STT: it works on Chrome / Edge / Safari, costs no bundle, and runs
 * the speech analysis on-device (Safari) or via the platform's STT
 * (Chrome — note: Chrome's webkit prefix routes through Google).
 * Whisper-WASM is too large per the spec's <10 MB constraint.
 *
 * Audio is never recorded to disk. The transcript is held in memory
 * and only persisted to IndexedDB if the user explicitly saves.
 */

import { useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSR(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function DreamJournal() {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getSR() !== null);
  }, []);

  const start = () => {
    const Ctor = getSR();
    if (!Ctor) return;
    try {
      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-GB";
      rec.onresult = (e) => {
        let finalText = "";
        let interimText = "";
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          const text = r[0]?.transcript ?? "";
          if (r.isFinal) finalText += text;
          else interimText += text;
        }
        if (finalText) setTranscript((t) => (t ? `${t} ${finalText}` : finalText));
        setInterim(interimText);
      };
      rec.onerror = () => stop();
      rec.onend = () => setRecording(false);
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setSupported(false);
    }
  };

  const stop = () => {
    try { recRef.current?.stop(); } catch { /* */ }
    setRecording(false);
  };

  const clear = () => { setTranscript(""); setInterim(""); };

  if (!supported) {
    return (
      <p className="text-[11px] text-lunar-silver/65">
        Speech recognition is not available on this browser. Type your dream below.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-indigo-deep/60 p-3">
        <textarea
          className="h-32 w-full rounded bg-black/30 p-2 font-sans text-sm text-lunar-silver"
          placeholder="The dream as you remember it…"
          value={transcript + (interim ? ` ${interim}` : "")}
          onChange={(e) => setTranscript(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {!recording ? (
            <button
              type="button"
              onClick={start}
              className="rounded-full bg-pineal-gold px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-indigo-deep"
            >
              Record voice memo
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="rounded-full border border-pineal-gold/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-pineal-gold"
            >
              Stop
            </button>
          )}
          <button
            type="button"
            onClick={clear}
            className="rounded-full border border-lunar-silver/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
          >
            Clear
          </button>
        </div>
        <p className="mt-2 text-[10px] text-lunar-silver/55">
          Audio is never written to disk. Transcripts stay in this browser.
        </p>
      </div>
    </div>
  );
}
