"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { resolveLocale, t as tString, type Locale } from "./i18n";

type I18nValue = {
  locale: Locale;
  t: (key: string) => string;
};

const I18nCtx = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({ locale, t: (key: string) => tString(locale, key) }),
    [locale],
  );
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(): I18nValue {
  const v = useContext(I18nCtx);
  if (v) return v;
  // Out-of-tree fallback so server components / tests don't crash:
  // resolve from pathname or default to English.
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const locale = resolveLocale(pathname);
  return { locale, t: (key: string) => tString(locale, key) };
}
