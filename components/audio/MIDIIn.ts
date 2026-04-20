/**
 * MIDIIn — Phase 5 wearable communion.
 *
 * Practitioner instruments (keyboards, Roli Seaboard, MIDI singing
 * bowls) become an additional input layer. We surface note-on / note-off
 * events and aggregate chroma so the composer can resonate with
 * whatever's being played.
 *
 * Web MIDI is Chromium-only — capability-gate.
 */

export type MIDINote = { note: number; velocity: number; on: boolean; at: number };

type Listener = (note: MIDINote) => void;

type WebMIDIAccess = {
  inputs: { values: () => IterableIterator<{
    name?: string | null;
    addEventListener: (ev: string, cb: (e: { data: Uint8Array; receivedTime: number }) => void) => void;
    removeEventListener?: (ev: string, cb: (e: { data: Uint8Array; receivedTime: number }) => void) => void;
  }> };
};

export class MIDIIn {
  private access: WebMIDIAccess | null = null;
  private inputs: { name: string; remove: () => void }[] = [];
  private listeners = new Set<Listener>();

  static isSupported(): boolean {
    return typeof navigator !== "undefined" &&
      typeof (navigator as Navigator & { requestMIDIAccess?: () => Promise<WebMIDIAccess> }).requestMIDIAccess === "function";
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  async start(): Promise<boolean> {
    if (!MIDIIn.isSupported()) return false;
    try {
      const nav = navigator as Navigator & { requestMIDIAccess: () => Promise<WebMIDIAccess> };
      this.access = await nav.requestMIDIAccess();
      this.inputs = [];
      for (const inp of this.access.inputs.values()) {
        const handler = (e: { data: Uint8Array }) => this.onMessage(e.data);
        inp.addEventListener("midimessage", handler);
        this.inputs.push({
          name: inp.name ?? "unknown",
          remove: () => inp.removeEventListener?.("midimessage", handler),
        });
      }
      return this.inputs.length > 0;
    } catch {
      return false;
    }
  }

  listInputs(): string[] {
    return this.inputs.map((i) => i.name);
  }

  stop(): void {
    this.inputs.forEach((i) => i.remove());
    this.inputs = [];
    this.access = null;
  }

  private onMessage(data: Uint8Array): void {
    if (data.length < 3) return;
    const status = data[0];
    const type = status & 0xf0;
    if (type === 0x90 || type === 0x80) {
      const note = data[1];
      const velocity = data[2];
      const on = type === 0x90 && velocity > 0;
      const reading: MIDINote = { note, velocity, on, at: Date.now() };
      this.listeners.forEach((fn) => fn(reading));
    }
  }
}

export function midiNoteToHz(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}
