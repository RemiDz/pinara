"use client";

/**
 * /oracle — Phase 7. Standalone surface that requests an oracle
 * line and renders it. Strata-gated to Stratum 4+ in production;
 * exposed here for end-to-end testing.
 */

import { useEffect } from "react";
import { I18nProvider, useI18n } from "@/lib/i18n-react";
import { CosmicProvider, useCosmic } from "@/components/cosmic/CosmicContext";
import { OracleDisplay, useOracle } from "@/components/oracle/OracleEngine";

export default function OraclePage() {
  return (
    <I18nProvider locale="en">
      <CosmicProvider>
        <Inner />
      </CosmicProvider>
    </I18nProvider>
  );
}

function Inner() {
  const { t } = useI18n();
  const cosmic = useCosmic();
  const { result, loading, request } = useOracle();

  useEffect(() => {
    void request({
      cosmic: {
        planetaryHour: cosmic.planetaryHour?.planet,
        moonPhase: cosmic.moonPhase?.phaseName,
      },
      seed: Date.now() % 2147483647,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-[100dvh] bg-chamber p-6 text-lunar-silver">
      <div className="mx-auto max-w-md space-y-6 font-sans pt-20">
        <h1 className="text-center font-oracle text-3xl text-pineal-gold">Oracle</h1>
        {loading ? (
          <p className="text-center text-sm text-lunar-silver/65">{t("oracle.thinking")}</p>
        ) : (
          <OracleDisplay result={result} />
        )}
        <button
          type="button"
          onClick={() => void request({
            cosmic: {
              planetaryHour: cosmic.planetaryHour?.planet,
              moonPhase: cosmic.moonPhase?.phaseName,
            },
            seed: Date.now() % 2147483647,
          })}
          className="mx-auto block rounded-full border border-pineal-gold/60 px-5 py-2 text-xs uppercase tracking-[0.3em] text-pineal-gold"
        >
          {t("oracle.tap_to_receive")}
        </button>
        <a href="/" className="block text-center text-xs uppercase tracking-[0.3em] text-lunar-silver/60 hover:text-lunar-silver">
          Back to the chamber
        </a>
      </div>
    </main>
  );
}
