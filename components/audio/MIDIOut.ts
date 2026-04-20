/**
 * MIDIOut — Phase 3.2.
 *
 * Emits live composer state as MIDI Control Change messages on a
 * dedicated channel so practitioner outboard gear (synths, samplers,
 * lighting, OSC bridges) can react.
 *
 * Capability: Web MIDI is Chromium-only (Chrome, Edge, Opera,
 * Brave). iOS Safari + Firefox return undefined for
 * navigator.requestMIDIAccess. Caller MUST check `isSupported()`
 * before instantiation.
 *
 * CC map (channel 1):
 *   CC 12  drone Hz (mapped 60–150 → 0–127)
 *   CC 13  drone gain (× 127)
 *   CC 14  binaural gain
 *   CC 15  harmonic gain
 *   CC 16  schumann gain
 *   CC 17  voice F0 (60–800 Hz mapped log to 0–127)
 *   CC 18  HRV BPM (40–180 → 0–127)
 *   CC 19  breath BPM (3–24 → 0–127)
 *   CC 20  coherence (0–100 → 0–127)
 *   CC 21  depth (0–100 → 0–127)
 *   CC 22  meditation state (alert=0, drowsy=32, focused=64, absorbed=96, deep=127)
 */

export type MIDIState = {
  droneHz?: number;
  droneGain?: number;
  binauralGain?: number;
  harmonicGain?: number;
  schumannGain?: number;
  voiceF0?: number | null;
  hrvBpm?: number | null;
  breathBpm?: number | null;
  coherence?: number;
  depth?: number;
  meditationState?: "alert" | "drowsy" | "focused" | "absorbed" | "deep";
};

const STATE_CC = {
  alert: 0, drowsy: 32, focused: 64, absorbed: 96, deep: 127,
};

type WebMIDIAccess = {
  outputs: { values: () => IterableIterator<{ name?: string | null; send: (data: number[]) => void }> };
};

export class MIDIOut {
  private access: WebMIDIAccess | null = null;
  private outputs: { name: string; send: (data: number[]) => void }[] = [];

  static isSupported(): boolean {
    return typeof navigator !== "undefined" &&
      typeof (navigator as Navigator & { requestMIDIAccess?: () => Promise<WebMIDIAccess> }).requestMIDIAccess === "function";
  }

  async start(): Promise<boolean> {
    if (!MIDIOut.isSupported()) return false;
    try {
      const nav = navigator as Navigator & { requestMIDIAccess: () => Promise<WebMIDIAccess> };
      this.access = await nav.requestMIDIAccess();
      this.outputs = [];
      for (const out of this.access.outputs.values()) {
        this.outputs.push({ name: out.name ?? "unknown", send: out.send.bind(out) });
      }
      return this.outputs.length > 0;
    } catch {
      return false;
    }
  }

  listOutputs(): string[] {
    return this.outputs.map((o) => o.name);
  }

  emit(state: MIDIState): void {
    if (this.outputs.length === 0) return;
    if (state.droneHz != null) this.cc(12, mapRange(state.droneHz, 60, 150));
    if (state.droneGain != null) this.cc(13, Math.round(state.droneGain * 127));
    if (state.binauralGain != null) this.cc(14, Math.round(state.binauralGain * 127));
    if (state.harmonicGain != null) this.cc(15, Math.round(state.harmonicGain * 127));
    if (state.schumannGain != null) this.cc(16, Math.round(state.schumannGain * 127));
    if (state.voiceF0 != null) this.cc(17, mapLog(state.voiceF0, 60, 800));
    if (state.hrvBpm != null) this.cc(18, mapRange(state.hrvBpm, 40, 180));
    if (state.breathBpm != null) this.cc(19, mapRange(state.breathBpm, 3, 24));
    if (state.coherence != null) this.cc(20, Math.round((state.coherence / 100) * 127));
    if (state.depth != null) this.cc(21, Math.round((state.depth / 100) * 127));
    if (state.meditationState) this.cc(22, STATE_CC[state.meditationState]);
  }

  stop(): void {
    this.outputs = [];
    this.access = null;
  }

  private cc(controller: number, value: number): void {
    const v = Math.max(0, Math.min(127, value | 0));
    const message = [0xb0, controller, v]; // CC on channel 1
    for (const out of this.outputs) {
      try { out.send(message); } catch { /* device unplugged etc. */ }
    }
  }
}

function mapRange(x: number, lo: number, hi: number): number {
  if (hi <= lo) return 0;
  const norm = (x - lo) / (hi - lo);
  return Math.round(Math.max(0, Math.min(1, norm)) * 127);
}

function mapLog(x: number, lo: number, hi: number): number {
  if (x <= 0 || hi <= lo) return 0;
  const norm = (Math.log2(x) - Math.log2(lo)) / (Math.log2(hi) - Math.log2(lo));
  return Math.round(Math.max(0, Math.min(1, norm)) * 127);
}
