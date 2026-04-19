"use client";

/**
 * StrataGate — Phase 1 placeholder.
 *
 * Phase 4 owns the real implementation. In Phase 1, all gates are open
 * (no progression system yet) so this component simply renders its
 * children.
 */

import type { ReactNode } from "react";

export function StrataGate({
  children,
}: {
  required?: number;
  children: ReactNode;
}) {
  return <>{children}</>;
}
