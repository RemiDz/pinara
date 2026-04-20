"use client";

/**
 * StrataGate — gates child content behind a stratum unlock or a
 * specific feature key. Phase 4 ships the real implementation.
 */

import type { ReactNode } from "react";
import { isFeatureUnlocked, isStratumUnlocked, type StratumId } from "@/lib/strata";

type Props = {
  /** Render only when this stratum is unlocked */
  required?: StratumId;
  /** Or, render only when this feature key is unlocked */
  feature?: string;
  /** Render this when locked (defaults to nothing) */
  fallback?: ReactNode;
  children: ReactNode;
};

export function StrataGate({ required, feature, fallback = null, children }: Props) {
  const ok = required != null
    ? isStratumUnlocked(required)
    : feature != null
      ? isFeatureUnlocked(feature)
      : true;
  return <>{ok ? children : fallback}</>;
}
