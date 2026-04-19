# Pinara

> A pineal-gland-centred practice instrument.

Pinara is not a meditation app. It is a living object — a 3D pineal gland rendered in real time — that responds to your biology, the cosmos, and your practice history, composing sessions that have never existed before and never will again.

**Live:** [pinara.app](https://pinara.app)

---

## What it does

Pinara reads seven biometric streams simultaneously (heart rate variability, breath, voice, eye tracking, pupil dilation, facial tension, posture), fuses them with live cosmic data (planetary hour, Moon phase, Schumann resonance, solar wind, local geomagnetic field), and composes procedural audio in real time. No pre-recorded tracks. Every session is unique.

At deeper strata, the gland becomes transparent to reveal your personal natal cosmos. In AR mode, it anchors in physical space. In ceremony mode, participant phones mesh into a living collective field via peer-to-peer WebRTC.

All biometric processing happens on-device. Nothing leaves your phone.

---

## Ecosystem

Part of the [Harmonic Waves](https://harmonicwaves.app) family of practitioner-grade wellness instruments.

Sister apps: [Astrara](https://astrara.app) · [Lunata](https://lunata.app) · [Binara](https://binara.app) · [Sonarus](https://sonarus.app) · [Earth Pulse](https://shumann.app) · [Deep Whisper](https://deepwhisper.app) · [Tzolkin](https://tzolkin.app)

---

## Tech

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- React Three Fiber · WebGPU (ray-marched SDF) with WebGL2 fallback
- Tone.js · AudioWorklet DSP · Web Audio API · HRTF spatial audio
- MediaPipe Tasks · TensorFlow.js · ONNX Runtime Web (on-device ML)
- WebXR · Web Bluetooth · WebMIDI · WebNFC · WebRTC
- Swiss Ephemeris (via pyswisseph edge proxy) · astronomy-engine
- PWA · offline-first · Vercel · Cloudflare DNS

---

## Status

In active development. Phases shipping sequentially:

- [ ] Phase 1 — Foundation
- [ ] Phase 2 — Biometric Consciousness
- [ ] Phase 3 — Dynamic Composition
- [ ] Phase 4 — Strata & Inner Cosmos
- [ ] Phase 5 — Wearable Communion
- [ ] Phase 6 — Collective Field
- [ ] Phase 7 — Oracle & Gates

---

## Privacy

All biometric data stays on device. No cloud sync. No accounts in v1. No advertisements. No tracking beyond anonymous usage events via Plausible.

---

## Licence

All rights reserved. Source available for reference; not licensed for redistribution or commercial use.

---

Built by [Remigijus Dzingelevičius](https://github.com/RemiDz) · Harmonic Waves
