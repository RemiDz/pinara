"use client";

/**
 * WindowOfPower — Phase 7. Subtle banner that appears when the
 * cosmic window opens. Once-per-24h cap is enforced via localStorage
 * so it doesn't nag.
 */

import { useEffect, useState } from "react";

const LS_KEY = "pinara.last_window_at";

export function WindowOfPowerBanner({
  open,
  expiresAt,
  onDismiss,
}: {
  open: boolean;
  expiresAt: Date | null;
  onDismiss?: () => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!open) { setShow(false); return; }
    const last = readLast();
    if (last && Date.now() - last < 24 * 60 * 60 * 1000) return;
    writeLast(Date.now());
    setShow(true);
  }, [open]);

  if (!show) return null;

  const minutesLeft = expiresAt
    ? Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / 60_000))
    : null;

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-12 z-40 mx-auto max-w-md px-4">
      <div className="rounded-full bg-indigo-deep/85 px-4 py-2 text-center text-[11px] uppercase tracking-[0.25em] text-pineal-gold backdrop-blur">
        The field is open{minutesLeft != null ? ` for ${minutesLeft} min` : ""}.
        <button
          type="button"
          onClick={() => { setShow(false); onDismiss?.(); }}
          className="ml-3 text-lunar-silver/60"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function readLast(): number | null {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? Number(raw) : null;
  } catch { return null; }
}

function writeLast(t: number): void {
  try { window.localStorage.setItem(LS_KEY, String(t)); } catch { /* */ }
}
