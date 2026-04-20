/**
 * Pro tier — Phase 7.
 *
 * License validation hits a Cloudflare Worker proxy in production
 * (CLOUDFLARE_WORKER_LICENCE_URL env var). Until that's wired, a
 * localStorage flag honours-system gates the Pro feature set so the
 * UI is testable end-to-end.
 *
 * Honour-system gating is per the locked decisions: no DRM theatre.
 */

const LS_KEY = "pinara.license";
const GRACE_DAYS = 30;

export type LicenseTier = "free" | "pro" | "practitioner";

export type LicenseRecord = {
  tier: LicenseTier;
  /** Unix ms */
  validatedAt: number;
  /** Optional LemonSqueezy order id, when present */
  orderId?: string;
};

const DEFAULT: LicenseRecord = { tier: "free", validatedAt: 0 };

export function readLicense(): LicenseRecord {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<LicenseRecord>) };
  } catch { return DEFAULT; }
}

export function writeLicense(r: LicenseRecord): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(r)); } catch { /* */ }
}

export function currentTier(): LicenseTier {
  const rec = readLicense();
  if (rec.tier === "free") return "free";
  // 30-day offline grace per the locked decisions.
  if (Date.now() - rec.validatedAt > GRACE_DAYS * 86_400_000) return "free";
  return rec.tier;
}

export function isPro(): boolean {
  const t = currentTier();
  return t === "pro" || t === "practitioner";
}

export function isPractitioner(): boolean {
  return currentTier() === "practitioner";
}

/** Manual unlock — used by the /sell stub and any honour-system path. */
export function setTier(tier: LicenseTier, orderId?: string): void {
  writeLicense({ tier, validatedAt: Date.now(), orderId });
}
