/**
 * EEGBridge — Phase 5. Muse EEG headband over Web Bluetooth.
 *
 * Real Muse decoding (12-bit packed samples + battery + accel) is a
 * substantial implementation; this Phase 5 scaffold connects, exposes
 * connect/disconnect lifecycle, and surfaces a placeholder
 * `bandPower` reading so the UI plumbing is ready for the full
 * decoder in a follow-up. iOS Safari blocks Web Bluetooth entirely.
 */

const MUSE_SERVICE = "0000fe8d-0000-1000-8000-00805f9b34fb";

export type EEGBands = { delta: number; theta: number; alpha: number; beta: number; gamma: number };

export type EEGReading = {
  channels: { tp9: number; af7: number; af8: number; tp10: number };
  bandPower: EEGBands;
  battery: number | null;
  at: number;
};

type Listener = (r: EEGReading) => void;

type BluetoothLike = {
  requestDevice: (opts: { filters?: Array<{ services?: string[] }>; optionalServices?: string[] }) => Promise<{
    name?: string | null;
    gatt?: { connect: () => Promise<unknown>; disconnect: () => void };
  }>;
};

export class EEGBridge {
  private device: { gatt?: { disconnect: () => void } } | null = null;
  private listeners = new Set<Listener>();
  private connected = false;

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<{ ok: boolean; deviceName?: string; reason?: string }> {
    if (!EEGBridge.isSupported()) return { ok: false, reason: "unsupported" };
    const bt = (navigator as unknown as { bluetooth?: BluetoothLike }).bluetooth;
    if (!bt) return { ok: false, reason: "unsupported" };
    try {
      const device = await bt.requestDevice({
        filters: [{ services: [MUSE_SERVICE] }],
        optionalServices: [MUSE_SERVICE],
      });
      this.device = device;
      await device.gatt?.connect();
      this.connected = true;
      return { ok: true, deviceName: device.name ?? "Muse" };
    } catch (err) {
      return { ok: false, reason: (err as Error).name ?? "connect_failed" };
    }
  }

  async disconnect(): Promise<void> {
    try { this.device?.gatt?.disconnect(); } catch { /* */ }
    this.device = null;
    this.connected = false;
  }
}
