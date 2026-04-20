"use client";

/**
 * The Echo — Phase 7. Yesterday's session appears as a faint
 * after-image overlay if the user practised in the last 36 hours.
 */

import { useEffect, useState } from "react";
import { listRecentSessions, type SessionLogEntry } from "@/lib/storage";

export function Echo() {
  const [last, setLast] = useState<SessionLogEntry | null>(null);

  useEffect(() => {
    let active = true;
    void listRecentSessions(1).then((entries) => {
      if (!active) return;
      const e = entries[0];
      if (!e) return;
      const ageMs = Date.now() - e.startedAt;
      if (ageMs > 0 && ageMs < 36 * 3600 * 1000) setLast(e);
    });
    return () => { active = false; };
  }, []);

  if (!last) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-10"
      style={{
        background: "radial-gradient(circle at center, rgba(232, 184, 109, 0.10) 0%, transparent 36%)",
      }}
    />
  );
}
