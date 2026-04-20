"use client";

/**
 * /xr — WebXR AR chamber. Stratum 6 unlock per the mega spec.
 * iOS Safari has no WebXR support; this route gracefully surfaces
 * that constraint and offers a 2D fallback.
 */

import { useEffect, useState } from "react";
import { detectCapabilities } from "@/lib/capability";
import { I18nProvider, useI18n } from "@/lib/i18n-react";
import { CosmicProvider } from "@/components/cosmic/CosmicContext";
import { GlandWebGL } from "@/components/gland/GlandWebGL";
import { INTENTS } from "@/lib/intent";

export default function XRPage() {
  return (
    <I18nProvider locale="en">
      <CosmicProvider>
        <Inner />
      </CosmicProvider>
    </I18nProvider>
  );
}

type XRMode = "probing" | "supported" | "unsupported";

function Inner() {
  const { t } = useI18n();
  const [mode, setMode] = useState<XRMode>("probing");
  const [arSession, setArSession] = useState<XRSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    const caps = detectCapabilities();
    if (!caps.webXr) {
      if (!cancelled) setMode("unsupported");
      return;
    }
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    if (!xr) { if (!cancelled) setMode("unsupported"); return; }
    xr.isSessionSupported?.("immersive-ar").then((ok) => {
      if (!cancelled) setMode(ok ? "supported" : "unsupported");
    }).catch(() => {
      if (!cancelled) setMode("unsupported");
    });
    return () => { cancelled = true; };
  }, []);

  const startAR = async () => {
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    if (!xr) return;
    try {
      const session = await xr.requestSession("immersive-ar", {
        requiredFeatures: ["local-floor"],
        optionalFeatures: ["hit-test", "anchors"],
      });
      setArSession(session);
      session.addEventListener("end", () => setArSession(null));
    } catch {
      setMode("unsupported");
    }
  };

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-chamber text-lunar-silver">
      <div className="absolute inset-0">
        <GlandWebGL intent={INTENTS[1]} intensity={1} inSession={false} />
      </div>
      <div className="pointer-events-auto absolute inset-x-0 bottom-10 mx-auto flex max-w-md flex-col items-center gap-3 px-6 text-center font-sans text-sm">
        {mode === "probing" ? (
          <p className="text-lunar-silver/60">{t("xr.probing")}</p>
        ) : mode === "unsupported" ? (
          <p className="select-text text-lunar-silver/70">{t("xr.unsupported")}</p>
        ) : !arSession ? (
          <button
            type="button"
            onClick={() => void startAR()}
            className="rounded-full bg-pineal-gold px-5 py-2 text-xs uppercase tracking-[0.3em] text-indigo-deep"
          >
            {t("xr.enter")}
          </button>
        ) : (
          <p className="text-lunar-silver/70">{t("xr.in_session")}</p>
        )}
      </div>
    </main>
  );
}
