"use client";

/**
 * /sell — Phase 7. LemonSqueezy checkout stub + honour-system unlock
 * for testing. Real LemonSqueezy redirect URL goes via the
 * `LEMONSQUEEZY_STORE_ID` env var when wired.
 */

import { useEffect, useState } from "react";
import { currentTier, setTier, type LicenseTier } from "@/lib/license";

const PRO_PRICE = "£9.99";
const PRACT_PRICE = "£29.99";

export default function Sell() {
  const [tier, setLocal] = useState<LicenseTier>("free");
  const [key, setKey] = useState("");

  useEffect(() => { setLocal(currentTier()); }, []);

  const validate = async () => {
    try {
      const res = await fetch("/api/licence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = (await res.json()) as { ok: boolean; tier?: LicenseTier };
      if (data.ok && data.tier) {
        setTier(data.tier, key);
        setLocal(data.tier);
      }
    } catch { /* */ }
  };

  const reset = () => { setTier("free"); setLocal("free"); };

  return (
    <main className="min-h-[100dvh] bg-chamber px-6 py-16 text-lunar-silver">
      <div className="mx-auto max-w-md space-y-6 font-sans">
        <h1 className="font-oracle text-3xl text-pineal-gold">Pinara Pro</h1>
        <ul className="space-y-2 text-sm text-lunar-silver/85">
          <li>All seven strata</li>
          <li>Unlimited sessions, all lengths (11/22/33/55/66)</li>
          <li>Oracle archive + export</li>
          <li>Dream journal</li>
          <li>WebXR AR chamber</li>
          <li>All wearables (Muse, Polar, Oura, Whoop)</li>
          <li>Practitioner mode + ceremony + seeding</li>
        </ul>
        <div className="rounded-2xl bg-indigo-deep/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm">Pro · one-time</span>
            <span className="font-oracle text-2xl text-pineal-gold">{PRO_PRICE}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm">Practitioner · one-time</span>
            <span className="font-oracle text-2xl text-pineal-gold">{PRACT_PRICE}</span>
          </div>
          <p className="mt-2 text-[11px] text-lunar-silver/55">
            LemonSqueezy checkout will land when the store is wired.
            For now, paste a licence key below to unlock locally.
          </p>
        </div>

        <div className="rounded-2xl bg-black/40 p-4">
          <div className="text-[11px] uppercase tracking-[0.25em] text-lunar-silver/55">Licence key</div>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Any non-empty key in stub mode (PRACT-… for practitioner)"
            className="mt-2 w-full rounded bg-black/50 p-2 font-mono text-xs"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void validate()}
              className="rounded-full bg-pineal-gold px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-indigo-deep"
            >
              Validate
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-lunar-silver/30 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em]"
            >
              Reset to free
            </button>
          </div>
          <p className="mt-2 text-[11px] text-lunar-silver/65">
            Current tier: <span className="font-mono text-pineal-gold">{tier}</span>
          </p>
        </div>

        <a href="/" className="inline-block text-xs uppercase tracking-[0.3em] text-lunar-silver/60 hover:text-lunar-silver">
          Back to the chamber
        </a>
      </div>
    </main>
  );
}
