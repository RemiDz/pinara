"use client";

/**
 * PermissionPrompt — Phase 2 owns the real implementation when
 * biometric streams arrive. Phase 1 ships a tiny stub.
 */

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n-react";

type Props = {
  messageKey: string;
  onAccept: () => void;
  children?: ReactNode;
};

export function PermissionPrompt({ messageKey, onAccept, children }: Props) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md p-4">
      <div className="rounded-2xl bg-indigo-deep/90 p-4 text-lunar-silver shadow-xl backdrop-blur">
        <p className="select-text font-sans text-sm">{t(messageKey)}</p>
        <button
          type="button"
          onClick={onAccept}
          className="mt-3 rounded-full bg-pineal-gold px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-indigo-deep"
        >
          {t("session.start")}
        </button>
        {children}
      </div>
    </div>
  );
}
