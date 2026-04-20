/**
 * WebNFC helpers — Phase 6 client seeding.
 *
 * Android Chrome only; iOS Safari does not expose NDEFReader.
 * Capability-gate before use.
 */

type NDEFReaderCtor = new () => {
  scan: () => Promise<void>;
  write: (msg: { records: { recordType: string; data: string }[] }) => Promise<void>;
  addEventListener: (ev: string, cb: (e: unknown) => void) => void;
};

export function isNFCSupported(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

export async function writeSeedTag(seedUrl: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isNFCSupported()) return { ok: false, reason: "unsupported" };
  try {
    const Ctor = (window as unknown as { NDEFReader?: NDEFReaderCtor }).NDEFReader;
    if (!Ctor) return { ok: false, reason: "unsupported" };
    const reader = new Ctor();
    await reader.write({ records: [{ recordType: "url", data: seedUrl }] });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: (err as Error).name ?? "write_failed" };
  }
}
