/**
 * Intent archetypes — six radial choices around the gland.
 *
 * Each archetype defines an audio profile (binaural carrier band,
 * drone fundamental relative to Schumann, solfeggio overtone, target
 * breath rate, bhramari cue cadence) plus colour palette and
 * bilingual labels. The audio composer reads these as defaults; later
 * phases mutate them with biometric input.
 *
 * Frequency choices follow Hans Cousto's Cosmic Octave for planetary
 * tones (Phase 3) and accepted entrainment ranges for delta/theta/alpha.
 */

export type FrequencyBand = "delta" | "theta" | "alpha-theta" | "alpha" | "theta-gamma";

export type IntentDefinition = {
  id: IntentId;
  /** Bilingual short label */
  label: { en: string; lt: string };
  /** One-line description for capability banner / accessibility */
  description: { en: string; lt: string };
  /** Visual signature */
  palette: {
    rim: string; // bioluminescent rim (hex)
    inner: string; // inner light (hex)
    accent: string; // accent particles (hex)
  };
  /** Audio defaults — Phase 1 composer reads these directly */
  audio: {
    /** Dominant entrainment band — selects binaural offset */
    band: FrequencyBand;
    /** Binaural beat offset in Hz (carrier frequency difference) */
    binauralOffsetHz: number;
    /** Carrier frequency for binaural layer (Hz) */
    binauralCarrierHz: number;
    /** Drone fundamental in Hz — Phase 1 default; Phase 2 retunes to Schumann */
    droneHz: number;
    /** Solfeggio / pineal overtone (Hz) */
    overtoneHz: number;
    /** Target coherence breath rate in breaths per minute */
    targetBreathBpm: number;
    /** Seconds between bhramari cues; null = no cues */
    bhramariCadenceSec: number | null;
  };
};

export type IntentId =
  | "clear"
  | "open"
  | "see"
  | "remember"
  | "release"
  | "rest";

export const INTENTS: readonly IntentDefinition[] = [
  {
    id: "clear",
    label: { en: "Clear", lt: "Skaidrinti" },
    description: {
      en: "Release, unwind, decalcify.",
      lt: "Atleisti, atsipalaiduoti, išgryninti.",
    },
    palette: { rim: "#7AA0E8", inner: "#1B2A4A", accent: "#C4CAD0" },
    audio: {
      band: "delta",
      binauralOffsetHz: 2.5,
      binauralCarrierHz: 174,
      droneHz: 55.5,
      overtoneHz: 936,
      targetBreathBpm: 5,
      bhramariCadenceSec: null,
    },
  },
  {
    id: "open",
    label: { en: "Open", lt: "Atverti" },
    description: {
      en: "Heart-centred, gentle opening.",
      lt: "Iš širdies, švelnus atsivėrimas.",
    },
    palette: { rim: "#E8B86D", inner: "#3A2A14", accent: "#F0D49B" },
    audio: {
      band: "alpha-theta",
      binauralOffsetHz: 7.83,
      binauralCarrierHz: 210.42,
      droneHz: 111,
      overtoneHz: 528,
      targetBreathBpm: 6,
      bhramariCadenceSec: 180,
    },
  },
  {
    id: "see",
    label: { en: "See", lt: "Regėti" },
    description: {
      en: "Vision, insight, intuition.",
      lt: "Vizija, įžvalga, intuicija.",
    },
    palette: { rim: "#C094E8", inner: "#2A1A3A", accent: "#E8D0F0" },
    audio: {
      band: "theta-gamma",
      binauralOffsetHz: 6.3,
      binauralCarrierHz: 221.23,
      droneHz: 110.55,
      overtoneHz: 936,
      targetBreathBpm: 5,
      bhramariCadenceSec: 240,
    },
  },
  {
    id: "remember",
    label: { en: "Remember", lt: "Atminti" },
    description: {
      en: "Ancestral, subconscious retrieval.",
      lt: "Protėvių, pasąmoninis sugrįžimas.",
    },
    palette: { rim: "#94B8B0", inner: "#1A2A28", accent: "#C4D8D0" },
    audio: {
      band: "theta",
      binauralOffsetHz: 4.5,
      binauralCarrierHz: 183.58,
      droneHz: 91.79,
      overtoneHz: 432,
      targetBreathBpm: 4.5,
      bhramariCadenceSec: 300,
    },
  },
  {
    id: "release",
    label: { en: "Release", lt: "Paleisti" },
    description: {
      en: "Cathartic, emotional flow.",
      lt: "Katartinis, jausmų tėkmė.",
    },
    palette: { rim: "#E89494", inner: "#3A1A1A", accent: "#F0C4C4" },
    audio: {
      band: "theta",
      binauralOffsetHz: 5.5,
      binauralCarrierHz: 141.27,
      droneHz: 70.64,
      overtoneHz: 396,
      targetBreathBpm: 6,
      bhramariCadenceSec: 150,
    },
  },
  {
    id: "rest",
    label: { en: "Rest", lt: "Ilsėtis" },
    description: {
      en: "Pre-sleep, melatonin-supportive.",
      lt: "Prieš miegą, palaiko melatoniną.",
    },
    palette: { rim: "#5A7AC4", inner: "#0E1A38", accent: "#94A8D0" },
    audio: {
      band: "delta",
      binauralOffsetHz: 1.5,
      binauralCarrierHz: 126.22,
      droneHz: 63.11,
      overtoneHz: 936,
      targetBreathBpm: 4,
      bhramariCadenceSec: null,
    },
  },
] as const;

export function getIntent(id: IntentId): IntentDefinition {
  const found = INTENTS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown intent id: ${id}`);
  return found;
}

/** Sacred session lengths in minutes. 11/22/33 free, 55/66 Pro. */
export const SESSION_LENGTHS = {
  free: [11, 22, 33] as const,
  pro: [11, 22, 33, 55, 66] as const,
};

export type SessionLengthMin = 11 | 22 | 33 | 55 | 66;
