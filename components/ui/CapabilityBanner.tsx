"use client";

/**
 * CapabilityBanner — surfaces missing capabilities in a calm,
 * informational tone. Never blocks interaction.
 */

import { useEffect, useState } from "react";
import { detectCapabilities, type Capabilities } from "@/lib/capability";
import { trackEvent } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n-react";

export function CapabilityBanner() {
  const { t } = useI18n();
  const [caps, setCaps] = useState<Capabilities | null>(null);

  useEffect(() => {
    const c = detectCapabilities();
    setCaps(c);
    if (!c.webaudio) trackEvent("capability_banner_shown", { missing: "webaudio" });
    else if (!c.webgl2 && !c.webgpu) trackEvent("capability_banner_shown", { missing: "webgl2" });
  }, []);

  if (!caps) return null;
  if (!caps.webaudio) {
    return (
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 select-text rounded-full bg-black/70 px-4 py-2 text-center font-sans text-xs text-lunar-silver/85">
        {t("capability.banner.no_audio")}
      </p>
    );
  }
  if (!caps.webgl2 && !caps.webgpu) {
    return (
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 select-text rounded-full bg-black/70 px-4 py-2 text-center font-sans text-xs text-lunar-silver/85">
        {t("capability.banner.no_webgl")}
      </p>
    );
  }
  return null;
}
