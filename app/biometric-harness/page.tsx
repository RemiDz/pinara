"use client";

/**
 * /biometric-harness — Phase 1 placeholder.
 *
 * Visualises the runtime capability matrix so we can confirm what
 * biometric streams a given device can actually expose. Real stream
 * visualisation lands in Phase 2.
 */

import { useEffect, useState } from "react";
import { detectCapabilities, type Capabilities } from "@/lib/capability";

export default function BiometricHarness() {
  const [caps, setCaps] = useState<Capabilities | null>(null);

  useEffect(() => {
    setCaps(detectCapabilities());
  }, []);

  return (
    <main className="min-h-[100dvh] w-screen bg-chamber p-6 text-lunar-silver">
      <div className="mx-auto max-w-2xl space-y-4 font-sans text-sm">
        <h1 className="text-lg font-semibold text-pineal-gold">Biometric harness</h1>
        <p className="text-lunar-silver/70">
          Phase 1 surfaces only the capability matrix. Stream graphs (HRV, breath,
          voice F0, eye, posture, EEG) arrive in Phase 2.
        </p>
        {caps ? (
          <table className="w-full select-text border-collapse text-xs">
            <thead>
              <tr className="text-lunar-silver/60">
                <th className="border-b border-lunar-silver/15 py-2 text-left">Capability</th>
                <th className="border-b border-lunar-silver/15 py-2 text-left">Available</th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(caps) as [keyof Capabilities, Capabilities[keyof Capabilities]][]).map(
                ([k, v]) => (
                  <tr key={k}>
                    <td className="border-b border-lunar-silver/10 py-1.5 pr-3 font-mono text-lunar-silver/85">{k}</td>
                    <td
                      className={
                        "border-b border-lunar-silver/10 py-1.5 font-mono " +
                        (v === true || v === "likely"
                          ? "text-pineal-gold"
                          : v === false || v === "no"
                            ? "text-lunar-silver/40"
                            : "text-lunar-silver/70")
                      }
                    >
                      {String(v)}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        ) : (
          <p className="text-lunar-silver/50">Detecting…</p>
        )}
      </div>
    </main>
  );
}
