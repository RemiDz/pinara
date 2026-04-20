/**
 * HeartRateBLE — Phase 5. Standard Bluetooth Heart Rate Service
 * (0x180D) supports Polar H10, Garmin HRM-Pro, generic chest straps.
 *
 * Web Bluetooth is Chromium-only. iOS Safari + Firefox return
 * undefined for navigator.bluetooth. Caller must check
 * `HeartRateBLE.isSupported()`.
 */

const HEART_RATE_SERVICE = "heart_rate";
const HEART_RATE_MEASUREMENT = "heart_rate_measurement";

export type BLEHeartReading = {
  /** Latest BPM reported by the strap */
  bpm: number;
  /** Most recent R-R intervals in ms (where the strap reports them) */
  rrIntervals: number[];
  /** Latest update timestamp, unix ms */
  at: number;
};

type Listener = (r: BLEHeartReading) => void;

type BluetoothLike = {
  requestDevice: (opts: {
    filters?: Array<{ services?: (string | number)[] }>;
    optionalServices?: (string | number)[];
  }) => Promise<{
    name?: string | null;
    gatt?: {
      connect: () => Promise<{
        getPrimaryService: (s: string) => Promise<{
          getCharacteristic: (c: string) => Promise<{
            startNotifications: () => Promise<{
              addEventListener: (ev: string, cb: (e: Event) => void) => void;
            }>;
            stopNotifications: () => Promise<unknown>;
            value?: DataView;
          }>;
        }>;
      }>;
      disconnect: () => void;
      connected: boolean;
    };
  }>;
};

export class HeartRateBLE {
  private device: { gatt?: { disconnect: () => void } } | null = null;
  private listeners = new Set<Listener>();
  private characteristic: { stopNotifications: () => Promise<unknown> } | null = null;

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  async connect(): Promise<{ ok: boolean; deviceName?: string; reason?: string }> {
    if (!HeartRateBLE.isSupported()) return { ok: false, reason: "unsupported" };
    const bt = (navigator as unknown as { bluetooth?: BluetoothLike }).bluetooth;
    if (!bt) return { ok: false, reason: "unsupported" };
    try {
      const device = await bt.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE] }],
        optionalServices: [HEART_RATE_SERVICE],
      });
      this.device = device;
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService(HEART_RATE_SERVICE);
      const char = await service?.getCharacteristic(HEART_RATE_MEASUREMENT);
      if (!char) return { ok: false, reason: "no_characteristic" };
      const notif = await char.startNotifications();
      this.characteristic = char as unknown as { stopNotifications: () => Promise<unknown> };
      notif.addEventListener("characteristicvaluechanged", (e: Event) => {
        const target = e.target as { value?: DataView };
        if (target.value) this.onMeasurement(target.value);
      });
      return { ok: true, deviceName: device.name ?? "BLE heart strap" };
    } catch (err) {
      return { ok: false, reason: (err as Error).name ?? "connect_failed" };
    }
  }

  async disconnect(): Promise<void> {
    try { await this.characteristic?.stopNotifications(); } catch { /* */ }
    try { this.device?.gatt?.disconnect(); } catch { /* */ }
    this.device = null;
    this.characteristic = null;
  }

  private onMeasurement(value: DataView): void {
    // BLE Heart Rate Measurement format (3.0):
    //   byte 0: flags
    //     bit 0: HR value 16-bit (else 8-bit)
    //     bit 4: RR-interval present
    //   byte 1+: HR + optional RR intervals
    const flags = value.getUint8(0);
    const hr16 = (flags & 0x01) === 0x01;
    let offset = 1;
    const bpm = hr16 ? value.getUint16(offset, true) : value.getUint8(offset);
    offset += hr16 ? 2 : 1;
    // Skip energy expended if present.
    if (flags & 0x08) offset += 2;
    const rrs: number[] = [];
    if (flags & 0x10) {
      while (offset + 1 < value.byteLength) {
        // R-R intervals are reported in 1/1024 s units.
        const raw = value.getUint16(offset, true);
        rrs.push(Math.round((raw / 1024) * 1000));
        offset += 2;
      }
    }
    const reading: BLEHeartReading = { bpm, rrIntervals: rrs, at: Date.now() };
    this.listeners.forEach((fn) => fn(reading));
  }
}
