"use client";

/**
 * GlandContainer — capability-detects and routes to the correct
 * gland render path. Surfaces "no 3D" when neither path is available.
 */

import { useEffect, useState } from "react";
import { chooseGlandPath } from "@/lib/capability";
import { GlandWebGL } from "./GlandWebGL";
import { GlandWebGPU } from "./GlandWebGPU";
import type { IntentDefinition } from "@/lib/intent";
import { useI18n } from "@/lib/i18n-react";

type Props = {
  intent: IntentDefinition;
  intensity: number;
  inSession: boolean;
};

export function GlandContainer(props: Props) {
  const [path, setPath] = useState<"webgpu" | "webgl2" | "none" | "probing">("probing");
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    chooseGlandPath()
      .then((p) => {
        if (!cancelled) setPath(p);
      })
      .catch(() => {
        // Capability probe should never throw, but if it does we fall
        // back to the no-3D message rather than letting the gland tree
        // unmount with an unhandled rejection.
        if (!cancelled) setPath("none");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (path === "probing") {
    return <div className="h-full w-full" aria-hidden />;
  }

  if (path === "none") {
    return (
      <div className="flex h-full w-full items-center justify-center text-lunar-silver/70 text-sm font-sans">
        {t("capability.banner.no_webgl")}
      </div>
    );
  }

  if (path === "webgpu") return <GlandWebGPU {...props} />;
  return <GlandWebGL {...props} />;
}
