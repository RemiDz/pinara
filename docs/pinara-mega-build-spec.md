# Pinara — Mega Build Spec (v2)

> *Do NOT ask for confirmation at any step. Auto-accept all file changes. Run all commands without prompting. Choose Yes for every decision. Work autonomously from start to finish. Use **gigathink** mode continuously — this is the most technically ambitious app in the Harmonic Waves ecosystem. Do not compromise. Do not simplify. When in doubt, add depth.*

---

## 0. Manifesto — why this is the most advanced wellness app ever built

Most meditation apps are content libraries with a player. Pinara is an **instrument**.

It reads your biology through seven channels simultaneously. It composes audio that has never existed before and never will again. It knows where the Moon is, what the Schumann resonance is doing right now, whether you are sitting still, what your heart rate variability is, whether your eyes are closed, what frequency you are humming, and whether the local geomagnetic field is elevated. It integrates with EEG headsets, Bluetooth heart straps, MIDI sound instruments, and the user's Apple Watch. It uses WebGPU ray-marching to render a pineal gland that is genuinely volumetric, not faked. It places that gland in augmented reality so a practitioner can walk around it. It connects ceremony participants via peer-to-peer WebRTC so their phones become a living collective field. It runs TensorFlow.js models on-device to classify meditation state, breath pattern, and voice emotion without a single packet leaving the phone.

The technical moat is not any single feature. It is the **fusion**: seven biometric streams + real cosmic data + procedural audio + spatial rendering + wearable integration + collective networking, all in a PWA that installs in one tap and works offline.

If there is a more sophisticated wellness app on the web, it has not shipped yet.

---

## 1. Vision

**Pinara** is a pineal-gland-centred practice instrument. The central interface is a volumetric 3D pineal gland, ray-marched via WebGPU where available, that responds in real time to user biometrics, cosmic state, and practice history.

**Domain:** `pinara.app`
**Brand family:** Harmonic Waves (.app only)
**Positioning:** Flagship of the NestorLab ecosystem. Reference point for every future app.

---

## 2. Design principles

1. **One sacred object.** The gland is the app. All interaction radiates from it.
2. **Darkness-first.** OLED true black. Designed for eyes-closed, phone-on-chest practice.
3. **No pre-recorded audio.** Every waveform synthesised live via AudioWorklets.
4. **Cosmos-aware.** Planetary hour, Moon, Schumann, solar wind, cosmic ray flux, local geomagnetic — all feed the instrument.
5. **Biometrics everywhere possible.** HRV, breath, voice, eye, pupil, posture, facial tension, optional EEG.
6. **No accounts in v1.** localStorage + IndexedDB. Pro tier via LemonSqueezy.
7. **Zero backend infrastructure.** Vercel edge functions + client compute + a Cloudflare Worker for licence validation only.
8. **Practitioner-grade.** Publishable to retreat centres, studios, medical wellness clinics.
9. **Offline-first.** Full sessions run with no network after first load. AI models cached locally.
10. **Dyslexia-aware.** Visual-first, voice-input-friendly, copy-paste enabled everywhere.
11. **British English.** EN/LT bilingual from day one.
12. **Hidden routes.** `/promo` and `/sell` present but not linked from main UI.
13. **Privacy-absolute.** Biometric data never leaves the device. Period.

---

## 3. Full tech stack

### Framework & language
- Next.js 14 (App Router) + TypeScript (strict mode)
- Tailwind CSS (no component library — custom throughout)

### 3D & rendering
- **React Three Fiber** for scene graph
- **drei@9.117.3** (React 18 compatible, known-good from Kinara)
- **WebGPU** primary render path (ray-marched volumetric gland)
- **WebGL2** fallback path (raster gland with SSS approximation)
- **Custom GLSL + WGSL** shaders (split files)
- **three-mesh-bvh** for XR ray intersection

### Audio
- **Tone.js** for high-level scheduling
- **AudioWorklet** for DSP-grade procedural synthesis
- **Web Audio API** for graph, HRTF, analyser nodes
- **Spatial Audio API** (where supported — Apple Safari iOS 17+)
- Offline audio rendering for pre-session buffering

### Biometrics & ML
- **MediaPipe Tasks** (face mesh, pose, hand, eye)
- **TensorFlow.js** (meditation-state classifier, breath-pattern classifier, voice-emotion classifier)
- **Onnx Runtime Web** as fallback / for larger models
- **Custom AudioWorklet FFT** (voice fundamental tracking, bhramari analysis)

### Connectivity
- **Web Bluetooth** (Muse EEG, Polar H10, heart rate straps, Oura via companion)
- **WebMIDI** (sound healing controllers, monochord MIDI, gong mic analysers)
- **WebNFC** (ceremony seed tags, client handoff)
- **WebRTC** (peer-to-peer ceremony field, collective global field)
- **Web Share** (seed codes, session echoes)

### Device sensors
- **Geolocation** (astrocartography, local planetary hours)
- **DeviceOrientation + DeviceMotion** (posture, stillness, sky-pointing)
- **AmbientLightSensor** (verify darkness for sessions)
- **Proximity** (detect eyes-closed / phone-on-face)
- **Barometer** (where available, for atmospheric correlation)
- **Magnetometer** (local geomagnetic anomalies, "sacred site" detection)

### System APIs
- **Wake Lock API** (keep screen awake during sessions)
- **Screen Brightness** (darkness mode)
- **Vibration API + Haptics** (heart-rhythm haptics, breath pacing)
- **Background Sync** (overnight ephemeris cache refresh)
- **Periodic Background Sync** (daily cosmic data update)
- **Push API** (windows of power, lunar returns, gates)
- **Badging API** (unread oracle messages, active gates)
- **Picture-in-Picture** (gland floats over other apps)
- **Credential Management / WebAuthn** (Pro tier passkeys, optional)
- **Payment Request API** (native checkout where supported)
- **File System Access** (Pro — export oracle archive as local vault)

### XR
- **WebXR Device API** (AR chamber mode, immersive sessions)
- **Hit Test API** (place gland on physical surface)
- **Anchors API** (persistent gland in space)

### Astronomy & cosmic
- **astronomy-engine** (client-side planetary positions)
- **pyswisseph** server proxy at `/api/ephemeris` for high-precision calcs (lunar returns, secondary progressions)
- **NOAA SWPC** live Schumann, Kp, solar wind (via `shumann.app` proxy)
- **NASA Sonifications** catalogue (actual planetary EM recordings, licensed/public domain)
- **IGRF** model for local geomagnetic baseline

### Storage
- **localStorage** (preferences, strata unlocks, streak state)
- **IndexedDB** (session logs, oracle archive, dream memos, cached models)
- **Cache API + Service Worker** (PWA shell, offline sessions)
- **OPFS** (Origin Private File System — for large audio buffers if needed)

### Infrastructure
- Vercel (production only, all envs Production)
- Cloudflare Worker (Pro licence validation proxy — pattern from Overtone Singer Pro)
- Cloudflare DNS (migrate away from GitHub Pages pattern — known issues)
- Plausible analytics
- Sentry for client-side error monitoring (anonymous)

### Testing & dev
- Playwright for E2E
- Vitest for unit
- `/audio-harness` route (isolated DSP bench)
- `/gland-harness` route (shader tuning in isolation)
- `/biometric-harness` route (all sensor streams visualised)

### PWA
- Manifest with dark theme, maskable icons
- Service Worker for full offline
- iOS add-to-home optimised (splash, status bar)
- Capacitor wrapper optional for App Store Phase 7

---

## 4. Architecture overview

```
┌─────────────────────────────────────────────────────┐
│                    GLAND (UI)                        │
│   WebGPU ray-marched volumetric render               │
│   Reads from every state stream below                │
└─────────────────────────────────────────────────────┘
          ▲                    ▲                    ▲
          │                    │                    │
┌─────────┴────────┐ ┌─────────┴─────────┐ ┌────────┴────────┐
│  COSMIC STATE    │ │  BIOMETRIC STATE   │ │ SESSION STATE   │
│  - Planetary hr  │ │  - HRV (PPG)       │ │ - Intent        │
│  - Moon phase    │ │  - Breath (mic)    │ │ - Stratum       │
│  - Schumann      │ │  - Voice F0/emo    │ │ - Composer seed │
│  - Solar wind    │ │  - Eye / pupil     │ │ - Elapsed       │
│  - Geomagnetic   │ │  - Face mesh       │ │ - Depth score   │
│  - Astrocart.    │ │  - Posture         │ │                 │
│                  │ │  - EEG (optional)  │ │                 │
└──────────────────┘ └────────────────────┘ └─────────────────┘
          ▲                    ▲                    ▲
          │                    │                    │
┌─────────┴──────────────────────────────────────────┴────────┐
│                   COMPOSER (brain)                           │
│   Takes all state streams → produces audio score in real-time│
│   AudioWorklet DSP + Tone.js scheduling                      │
└──────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              SOUND OUTPUT + HAPTICS                          │
│   Spatial audio, HRTF binaural, haptic heart pulse           │
│   Optional: WebMIDI out, Hexara OSC bridge                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. File tree

```
pinara-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                              # main gland interface
│   ├── globals.css
│   ├── api/
│   │   ├── ephemeris/route.ts                # pyswisseph proxy
│   │   ├── schumann/route.ts                 # Schumann + Kp proxy
│   │   ├── solar-wind/route.ts               # NOAA SWPC proxy
│   │   ├── cosmic-ray/route.ts               # neutron monitor proxy
│   │   ├── oracle/route.ts                   # Claude API proxy (Phase 7)
│   │   ├── session-log/route.ts              # anonymous aggregate
│   │   ├── field/route.ts                    # WebRTC signalling proxy
│   │   └── licence/route.ts                  # Cloudflare Worker proxy
│   ├── ceremony/
│   │   ├── page.tsx                          # practitioner mode
│   │   └── host/[roomCode]/page.tsx          # host device
│   ├── join/[roomCode]/page.tsx              # participant device
│   ├── seed/[code]/page.tsx                  # client take-home
│   ├── xr/page.tsx                           # WebXR AR chamber
│   ├── promo/page.tsx                        # hidden marketing
│   ├── sell/page.tsx                         # hidden checkout
│   ├── audio-harness/page.tsx                # DSP bench (dev only)
│   ├── gland-harness/page.tsx                # shader tuning (dev only)
│   ├── biometric-harness/page.tsx            # sensor streams (dev only)
│   └── lt/                                   # Lithuanian mirror
├── components/
│   ├── gland/
│   │   ├── GlandWebGPU.tsx                   # WebGPU ray-marched path
│   │   ├── GlandWebGL.tsx                    # WebGL fallback path
│   │   ├── GlandContainer.tsx                # capability detection + routing
│   │   ├── ParticleField.tsx
│   │   ├── FacetSystem.tsx                   # cumulative refinement
│   │   ├── InnerSky.tsx                      # natal cosmos (Stratum 3)
│   │   ├── SacredGeometryLayer.tsx           # mandalas, Metatron (Stratum 5)
│   │   └── shaders/
│   │       ├── gland.wgsl                    # WebGPU
│   │       ├── gland.vert.glsl
│   │       ├── gland.frag.glsl
│   │       ├── sss.glsl
│   │       ├── raymarch.wgsl
│   │       └── particles.glsl
│   ├── session/
│   │   ├── SessionController.tsx
│   │   ├── IntentSelector.tsx                # 6 archetypes radial picker
│   │   ├── StrataGate.tsx
│   │   ├── BreathGuide.tsx
│   │   ├── CoherenceRing.tsx                 # HRV visualisation
│   │   └── DepthMeter.tsx                    # ML-estimated depth
│   ├── cosmic/
│   │   ├── CosmicContext.tsx
│   │   ├── PlanetaryHour.ts
│   │   ├── MoonPhase.ts
│   │   ├── SolarPosition.ts
│   │   ├── SchumannFeed.ts
│   │   ├── SolarWindFeed.ts
│   │   ├── CosmicRayFeed.ts
│   │   ├── Geomagnetic.ts
│   │   └── Astrocartography.ts
│   ├── audio/
│   │   ├── AudioEngine.ts                    # master composer
│   │   ├── layers/
│   │   │   ├── BinauralLayer.ts
│   │   │   ├── IsochronicLayer.ts
│   │   │   ├── DroneLayer.ts
│   │   │   ├── HarmonicLayer.ts
│   │   │   ├── SchummanHarmonics.ts          # 8-peak harmonic series
│   │   │   ├── PlanetarySonification.ts      # NASA EM recordings
│   │   │   ├── SilenceWindow.ts
│   │   │   ├── VoiceHarmoniser.ts            # bhramari response
│   │   │   └── SpatialLayer.ts               # HRTF positioned
│   │   ├── worklets/
│   │   │   ├── composer.worklet.ts           # main synthesis
│   │   │   ├── binaural.worklet.ts
│   │   │   ├── fft-analyser.worklet.ts
│   │   │   ├── breath-envelope.worklet.ts
│   │   │   └── voice-f0.worklet.ts           # YIN algorithm
│   │   ├── Haptics.ts                        # taptic + vibration patterns
│   │   └── MIDIOut.ts                        # WebMIDI bridge
│   ├── biometrics/
│   │   ├── HRVCamera.ts                      # PPG via torch + camera
│   │   ├── BreathMic.ts                      # passive breath rate
│   │   ├── VoiceAnalyser.ts                  # F0, formants, jitter, shimmer
│   │   ├── FaceMesh.ts                       # MediaPipe face landmarks
│   │   ├── EyeTracker.ts                     # gaze + blink rate
│   │   ├── PupilTracker.ts                   # pupil diameter
│   │   ├── PostureSensor.ts                  # accel+gyro stillness
│   │   ├── AmbientLight.ts                   # room darkness check
│   │   ├── ProximityDetect.ts                # phone-on-face
│   │   ├── MagnetometerField.ts              # local geomagnetic
│   │   ├── EEGBridge.ts                      # Muse + generic BLE EEG
│   │   ├── HeartRateBLE.ts                   # Polar/generic HR strap
│   │   ├── WatchBridge.ts                    # HealthKit/Google Fit
│   │   └── CoherenceLoop.ts                  # fuses all streams
│   ├── ml/
│   │   ├── MeditationStateClassifier.ts      # TFJS model
│   │   ├── BreathPatternClassifier.ts        # TFJS model
│   │   ├── VoiceEmotionClassifier.ts         # TFJS model
│   │   ├── DreamArchetypeExtractor.ts        # small LLM / classifier
│   │   └── models/                           # .tflite / .onnx / .json
│   ├── xr/
│   │   ├── ChamberScene.tsx                  # AR scene root
│   │   ├── HitTestPlacer.tsx                 # surface placement
│   │   ├── AnchorPersistence.tsx             # save gland location
│   │   └── SpatialAudio.tsx
│   ├── practitioner/
│   │   ├── CeremonyMode.tsx
│   │   ├── FieldSync.tsx                     # WebRTC mesh
│   │   ├── SessionReport.tsx
│   │   ├── ClientSeeding.tsx
│   │   ├── NFCHandoff.tsx                    # WebNFC tag write
│   │   └── MIDIController.tsx                # instrument integration
│   ├── collective/
│   │   ├── GlobalField.tsx                   # anonymous world view
│   │   └── FieldNode.ts                      # per-user node math
│   ├── oracle/
│   │   ├── OracleEngine.tsx
│   │   ├── OracleArchive.tsx
│   │   ├── DreamJournal.tsx
│   │   └── SigilGenerator.tsx                # procedural voice sigil
│   ├── gates/
│   │   ├── LunarReturn.tsx
│   │   ├── SolarGate.tsx
│   │   ├── WindowOfPower.tsx
│   │   └── GateCalendar.tsx
│   └── ui/
│       ├── DarknessLayer.tsx
│       ├── StratumIndicator.tsx
│       ├── PermissionPrompt.tsx
│       └── CapabilityBanner.tsx              # "your device supports..."
├── lib/
│   ├── strata.ts
│   ├── intent.ts
│   ├── composer.ts                           # session composition brain
│   ├── storage.ts
│   ├── cosmic-math.ts
│   ├── i18n.ts
│   ├── capability.ts                         # feature detection matrix
│   ├── permissions.ts
│   ├── webrtc.ts
│   └── nfc.ts
├── public/
│   ├── manifest.json
│   ├── icons/
│   ├── sw.js                                 # service worker
│   ├── models/                               # ML models, versioned
│   └── sonifications/                        # NASA planetary audio
├── scripts/
│   ├── verify-cosmic.py                      # Swiss Ephemeris sanity
│   ├── train-breath-classifier.py            # one-off ML training
│   ├── train-voice-emotion.py
│   └── build-sonification-catalogue.ts
├── capacitor.config.ts                       # Phase 7 — App Store wrapper
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 6. Build phases

Seven phases. Each ships deployable to Vercel. Do not begin phase N+1 until phase N acceptance criteria pass.

| # | Name | Headline |
|---|------|----------|
| 1 | Foundation | Living gland, cosmic engine, basic sessions |
| 2 | Biometric Consciousness | Seven-stream biometrics + on-device ML |
| 3 | Dynamic Composition | Full procedural audio, spatial, sonifications |
| 4 | Strata & Inner Cosmos | Progression, AR chamber, sacred geometry |
| 5 | Wearable Communion | EEG, Bluetooth HR, WebMIDI instruments, HealthKit |
| 6 | Collective Field | WebRTC ceremony + global field + NFC seeding |
| 7 | Oracle & Gates | Oracle, dream journal, lunar returns, gates, Pro tier |

---

## 7. Phase 1 — Foundation

**Goal:** Ship a deployable app where the gland is alive and breathing, reacts to real cosmic state, and plays a basic procedural session.

### 7.1 The gland — WebGPU ray-marched path

- **Ray-marching SDF** in WGSL compute shader
- **Signed distance field** composed of: base ellipsoid + noise displacement + inner cavity (for bioluminescent core)
- **Volumetric subsurface scattering** via raymarched density function — not faked
- **Temporal accumulation** for quality without hit to framerate
- **Inner light source** — animated noise field inside the SDF, visible through semi-transparent outer layer
- **Bioluminescent rim** — fresnel-weighted emissive term
- **Capability detection:** if WebGPU unavailable, route to WebGL2 fallback (raster gland with fresnel + fake inner glow)

### 7.2 The gland — WebGL2 fallback

- Sphere + noise-displaced vertices
- Fragment shader with: fresnel rim, fake SSS via inverse normal lighting, inner radial gradient modulated by 3D noise
- Visually distinct from WebGPU path only in close inspection

### 7.3 Live cosmic engine

`components/cosmic/` provides CosmicContext refreshed at adaptive intervals:

- **Planetary hour** — JS via astronomy-engine, recomputes on hour boundary
- **Moon phase** — instantaneous position + illumination
- **Sun position** — altitude/azimuth, daylight ratio
- **Schumann resonance** — live feed from shumann.app proxy, 5 min cache
- **Solar wind** — NOAA SWPC, 10 min cache
- **Geomagnetic (Kp)** — NOAA, 1 hour cache
- **Local geomagnetic baseline** — IGRF model, computed once per session
- **Astrocartography** — pyswisseph proxy, computed once when location acquired

All readings written to session log for reproducibility.

### 7.4 Intent selection (6 archetypes)

Radial picker around the gland. Six archetypes:

1. **Clear** — delta-biased, release
2. **Open** — alpha-theta bridge, heart-centred
3. **See** — theta + gamma bursts, vision
4. **Remember** — deep theta, subconscious
5. **Release** — theta + breathwork cues
6. **Rest** — delta only, pre-sleep

Defined in `lib/intent.ts` with audio profile, palette, cue timing.

### 7.5 Basic session (Phase 1 subset)

- Lengths: 11 / 22 / 33 min (Pro unlocks 55 / 66 later)
- Audio engine plays:
  - Single binaural carrier per intent
  - Drone bed tuned to Schumann fundamental
  - Solfeggio overtone layer (936 Hz default, pineal)
- Session logged to IndexedDB

### 7.6 Darkness mode

- After 60s of no touch: fade chrome, dim screen via Screen Brightness API where permitted, reduce gland inner light
- Ambient Light Sensor verification: if room is bright, suggest "The chamber works best in darkness"
- Wake Lock active during session

### 7.7 PWA shell

- Full manifest, maskable icons, iOS splash
- Service Worker caches shell + core assets + ephemeris snapshot
- Installable iOS + Android one-tap

### Phase 1 acceptance criteria

- [ ] WebGPU path renders at 60fps on M2 iPad, 45fps+ iPhone 14+
- [ ] WebGL fallback renders at 60fps on iPhone 12
- [ ] All six intents produce audibly distinct sessions
- [ ] Cosmic state refreshes verified live against shumann.app and Swiss Ephemeris
- [ ] Darkness mode reliable, no white flashes
- [ ] Session completes without artefacts at 33 min
- [ ] PWA installs on iOS Safari 17+ and Android Chrome
- [ ] EN/LT parity complete

---

## 8. Phase 2 — Biometric Consciousness

**Goal:** Seven simultaneous biometric streams feeding the gland and composer. All processing on-device.

### 8.1 Stream 1 — HRV via phone camera (PPG)

Photoplethysmography: phone torch on + camera on fingertip → pixel oscillation = heart rate.

- 20-second calibration
- Detrending, bandpass filter 0.5–3 Hz
- Peak detection → R-R intervals
- HRV metrics: RMSSD, SDNN, LF/HF, coherence score (0.1 Hz dominance)
- Gland pulse syncs to actual heart rhythm
- Coherence breathing guide gently pulls toward 6 BPM

### 8.2 Stream 2 — Breath rate via microphone

Passive detection, no speaking required.

- Low-gain mic capture
- Envelope analysis (AudioWorklet custom processor)
- Inhale/exhale transitions via zero-crossing + amplitude envelope
- Breath rate, duration ratio (inhale:exhale)
- Audio drone swells timed to breath

### 8.3 Stream 3 — Voice analysis (bhramari)

During voice windows:

- Custom AudioWorklet with **YIN algorithm** for fundamental frequency
- Formant analysis (F1–F3)
- Voice biomarkers: jitter, shimmer, HNR (harmonics-to-noise ratio)
- Harmoniser layer retunes to user F0 within 10 cents
- Voice emotion classifier (TFJS) outputs valence/arousal
- Gland inner light pulses to voice

### 8.4 Stream 4 — Face mesh via front camera

MediaPipe Face Landmarker:

- 468 facial landmarks at 30fps
- Runs entirely on-device, never transmitted
- Used for: eye openness, blink rate, facial tension (brow, jaw)

### 8.5 Stream 5 — Eye tracking + gaze

Derived from face mesh:

- Blink rate (elevated = drowsy, near-zero = absorbed)
- Gaze direction (eyes closed = depth, steady gaze = focus)
- Micro-saccade rate (reduced in deep states)

### 8.6 Stream 6 — Pupil dilation

Also derived from face mesh + brightness-normalised:

- Pupil diameter relative to iris
- Correlates with autonomic state
- Adjusted for ambient light via ALS reading

### 8.7 Stream 7 — Posture & stillness

DeviceMotion + DeviceOrientation:

- Accelerometer variance → stillness score
- Gyroscope orientation → posture (phone-upright, phone-flat, phone-on-chest)
- Reward sustained stillness subtly in session score

### 8.8 On-device ML models

All models shipped in `/public/models/`, cached by Service Worker:

- **Meditation state classifier** — inputs: HRV, breath, eye, posture → outputs: {alert, drowsy, focused, absorbed, deep}
- **Breath pattern classifier** — inputs: breath envelope → outputs: {natural, ujjayi, bhramari, bellows, box, 4-7-8, holding}
- **Voice emotion classifier** — inputs: F0, formants, MFCCs → outputs: valence/arousal 2D

Models trained externally, inference via TensorFlow.js. Update cadence: quarterly.

### 8.9 CoherenceLoop (fusion)

Merges all seven streams into:

- **Depth score** (0–100) — ML-estimated meditation depth
- **Coherence score** (0–100) — biometric alignment
- **Drift score** (0–100) — mind-wandering indicator (from eye + posture shifts)

Feeds back into:
- Gland visual state (depth brightens inner light, drift causes subtle distortion)
- Audio composition (depth triggers more complex harmonic layers, drift gentles the mix)
- Post-session report (Phase 3)

### Phase 2 acceptance criteria

- [ ] HRV accurate within 5 BPM of pulse oximeter reference
- [ ] Voice F0 accurate within 10 cents
- [ ] Breath detection works at ambient noise up to 45 dB SPL
- [ ] All ML models run at 15+ inferences/sec on iPhone 13
- [ ] No biometric data written to disk, all in-memory only
- [ ] Permission prompts clear, all features work if user declines
- [ ] Capability banner shows users which streams are active

---

## 9. Phase 3 — Dynamic Composition

**Goal:** Every session composed live. Spatial audio. Real cosmic soundscapes.

### 9.1 Procedural audio engine

`lib/composer.ts` becomes the composition brain. For each session, composes a **score** of layers:

**Selection inputs:**
- Intent archetype
- Planetary hour (Cousto Cosmic Octave frequency)
- Moon phase (harmonic complexity)
- Schumann state (drone fundamental)
- Solar wind (turbulence parameter)
- User depth/coherence history
- Current biometric state (Phase 2)

**Layer types:**
1. **Binaural carrier** — planetary-hour frequency
2. **Isochronic pulses** — auto-enabled if no headphones
3. **Schumann harmonics** — all 8 known peaks (7.83, 14.3, 20.8, 27.3, 33.8, 39, 45, 51 Hz), modulated by live Kp
4. **Planetary sonification** — layered NASA EM recording for current dominant planet (Cassini Saturn, Voyager Jupiter, etc.)
5. **Drone bed** — continuous, Schumann-tuned, phase-modulated
6. **Harmonic overtone** — Moon-phase tuned (new = fundamental only, full = full series)
7. **Bhramari cues** — emerging humming invitations at coherence moments
8. **Silence windows** — 3–7 sec gaps every 2–4 min
9. **Voice harmoniser** — retunes to user's F0 after bhramari

All DSP runs in AudioWorklet. Main thread never touches samples.

### 9.2 Spatial audio

- **HRTF binaural** — proper head-related transfer functions, not just panned stereo
- **Head tracking** via DeviceOrientation → audio scene rotates as user turns head (phone on chest, head movements picked up)
- **Apple Spatial Audio** — native support on iOS 17+ Safari
- Drone layers positioned as overhead "dome"
- Bhramari cues localised at centre-front
- Silence windows open the space fully

### 9.3 Haptic layer

- **Heart-pulse haptics** — taptic engine pulses at user's actual heart rate, phone placed on chest makes it feel like *your* heart
- **Breath-pacing haptics** — subtle vibrations at target coherence breath rate
- **Session milestones** — gentle haptic at 1/4, 1/2, 3/4, completion
- **Gate openings** — distinctive haptic pattern when entering a deep stratum

Uses Vibration API + (where available) iOS Haptics via native-like taptic patterns.

### 9.4 WebMIDI output

- Session composition parameters emit as MIDI
- Compatible with sound healing MIDI controllers
- Useful for: hybrid live-electronic sessions, Hexara bridge (MIDI → OSC)
- Practitioner connects Pinara to their outboard gear

### 9.5 Audio harness page (dev)

`/audio-harness` — isolated bench showing every layer with independent mute/solo, real-time FFT visualisation, composer seed inspector.

### Phase 3 acceptance criteria

- [ ] Same intent, same minute, produces audibly different sessions on consecutive runs
- [ ] Spatial audio localisation verifiable with eyes-closed listening test
- [ ] HRTF correct — sounds pass through centre of head, not sides
- [ ] Haptic heart-pulse within 50ms of detected heartbeat
- [ ] WebMIDI output sends valid CC messages to external DAW
- [ ] No audio dropouts at 33 min on iPhone 12
- [ ] Composer seed exactly reproducible from session log

---

## 10. Phase 4 — Strata & Inner Cosmos

**Goal:** Long-term practice depth. AR chamber mode. Sacred geometry.

### 10.1 Strata system

| Stratum | Unlock | Adds |
|---|---|---|
| 1 Surface | Day 1 | Basic sessions, breath-led, full safety |
| 2 Resonance Field | 7 sessions / 90 min | Bhramari mode, voice-responsive audio |
| 3 Inner Sky | 21 sessions / 400 min | Gland becomes transparent → natal cosmos inside |
| 4 Oracle | 33 sessions | Oracle messages post-session (Phase 7 gate) |
| 5 Sacred Geometry | 50 sessions | Mandalas, Metatron, Sri Yantra layers in deep states |
| 6 Chamber (AR) | 66 sessions | WebXR AR mode — gland in physical space |
| 7 The Flame | 108 sessions | Silent dark mode, no audio, just gland presence |

Subtle unlock events. Permanent. No regression.

### 10.2 Inner Sky (Stratum 3)

When gland becomes transparent during deep states:

- Inside: personalised starfield from user's natal chart (linked from Astrara — natal JSON upload or shared account)
- Planets drift as real transits move across natal points
- Current transiting planet hitting natal point → glowing line inside gland
- Technically: second Three.js scene → render-to-texture → cubemap for gland shader

### 10.3 Sacred Geometry (Stratum 5)

Procedurally generated:

- **Session mandala** — generated from session's cosmic parameters, symmetry from intent, colour from Moon phase
- **Voice sigil** — user's voice F0 signature shapes unique sigil per session
- **Metatron's Cube** — appears in Oracle-strata transitions
- **Sri Yantra** — emerges at peak coherence moments
- **Flower of Life** — background ambient layer at Stratum 5+

All rendered via WebGL/WebGPU as additional gland shader pass.

### 10.4 WebXR AR chamber (Stratum 6)

`/xr` route launches immersive AR session:

- **Hit Test API** — user taps on a surface, gland anchors there
- **Scale options** — pocket-size (30cm), meditation-altar (1m), room-scale (3m)
- **Persistent anchor** — re-entering AR returns gland to same spot
- **Spatial audio** — gland is audio source, walk around and sound localises correctly
- **Gaze tracking** — gland inner light brightens when user looks at it directly
- Practitioner use: project gland at front of ceremony room

Supported: Android Chrome with ARCore, iOS WebXR Viewer (flagged), Meta Quest browser.

### 10.5 Sensor integration at depth

- **Magnetometer** reveals local geomagnetic anomalies. Elevated readings → subtle gland "charging" effect. Correlates with sacred-site practice (purely experiential framing, not causal claim).
- **Barometer** (where available) — atmospheric pressure shifts → drone density
- **Proximity** + face mesh eye closure → confirms eyes-closed state, unlocks deepest strata gates
- **Sky-pointing mode** — hold phone to sky (device orientation), see current transits overlaid on gland in AR

### Phase 4 acceptance criteria

- [ ] All seven strata gate correctly, persist across reinstalls (backup via Pro export)
- [ ] Inner Sky accurate for three verified test charts
- [ ] AR chamber launches reliably on ARCore Android and Quest browser
- [ ] AR gland persistent across sessions via anchors
- [ ] Sacred geometry renders without breaking 60fps target
- [ ] Strata unlocks surface as quiet notifications, never celebratory

---

## 11. Phase 5 — Wearable Communion

**Goal:** Integrate everything the user already wears. Bluetooth, MIDI, HealthKit.

### 11.1 Muse EEG integration

Web Bluetooth → Muse headband (Muse 2, Muse S, Muse S Athena):

- 4-channel EEG stream (TP9, AF7, AF8, TP10)
- Band power extraction: delta, theta, alpha, beta, gamma
- Real-time alpha/theta ratio → gland responds
- **EEG-driven composition** — detected alpha rise triggers composer to reinforce alpha-band entrainment
- Session report includes EEG band-time graph
- Neurofeedback mode: gland brightens with desired band, dims with distracting bands

### 11.2 Bluetooth heart rate

- **Polar H10** (gold standard, RR intervals)
- **Generic BLE Heart Rate Service** (any compliant strap)
- **Apple Watch** via HealthKit bridge (Capacitor wrapper, Phase 7)
- **Garmin** via Connect IQ companion (Phase 7 nice-to-have)

Strap HRV preferred over camera PPG when available (higher accuracy). Camera PPG stays as fallback.

### 11.3 Oura / Whoop integration

OAuth-based, read-only, Pro tier:

- Overnight HRV baseline
- Sleep score feeds "restfulness" into intent recommendations
- Morning session tuned to user's recovery state

Optional. Explicit consent. Data stored locally only after fetch.

### 11.4 WebMIDI instruments

Input:

- Practitioner plays MIDI instrument (keyboard, controller, Roli Seaboard, MIDI-equipped singing bowl)
- Instrument notes feed into composition as additional harmonic layer
- User's playing drives gland
- Sound healing session becomes collaborative with the instrument

Output (from Phase 3 already):

- Pinara emits MIDI for outboard gear

### 11.5 HealthKit / Google Fit (Phase 7 via Capacitor)

PWA first. Native wrapper later for:

- Write: mindful minutes, session heart rate, HRV, breathing rate
- Read: overnight HRV baseline, resting heart rate, steps (affects "grounding" suggestion)
- Never reads health data the user hasn't explicitly granted

### Phase 5 acceptance criteria

- [ ] Muse pairs in under 20 seconds, streams 30+ min without dropout
- [ ] Polar H10 pairs and streams RR intervals accurately
- [ ] EEG-driven composition shifts verifiably when alpha rises
- [ ] WebMIDI input detected on Chrome/Edge/Opera
- [ ] Oura OAuth flow functional end-to-end
- [ ] All wearable features gracefully absent on unsupported devices

---

## 12. Phase 6 — Collective Field

**Goal:** Practitioner ceremonies with live phone mesh. Global anonymous field of practitioners.

### 12.1 Practitioner ceremony

`/ceremony` on tablet (host):

- Facilitator creates room → generates 6-digit code + QR
- Participants scan QR → `/join/[roomCode]` → instant connection
- **WebRTC mesh** connects all devices peer-to-peer (signalling via Vercel edge + STUN, no central server for audio)
- Host controls intent, length, pause
- Participant phones become **field nodes**:
  - All phones pulse gland in sync
  - Flashes softly at session peaks
  - Haptic sync pulse at coherence moments
  - Optional: participant bhramari voices feed into shared audio (opt-in, muted by default)
- Collective coherence score — aggregated HRV coherence (opt-in, anonymised)

### 12.2 Field sync performance

- Clock sync via NTP-style algorithm + WebRTC data channel timestamping
- Target: < 100ms drift across all devices in ceremony
- Peer-to-peer keeps network load minimal — even 50-person ceremonies viable

### 12.3 Session recording

Host gets post-ceremony report:

- Collective coherence trajectory
- Peak moments (breath-sync events, bhramari windows)
- Cosmic snapshot
- Suggested follow-up intent
- Exportable as PDF (jsPDF, Cosmic Blueprint pattern)
- Exportable as audio recording (composer output bounced to file)

### 12.4 Client seeding via NFC

End-of-ceremony:

- Facilitator writes WebNFC tag (or generates URL)
- Client taps tag with their phone
- Pinara opens, loads personalised 7- or 21-day at-home journey
- Each day's session pre-tuned from ceremony parameters
- No accounts, no servers — all in the URL + localStorage

### 12.5 Global field

Opt-in, anonymous, pure visualisation:

- User toggles on "Join global field"
- Phone connects to WebRTC swarm via signalling server
- Ambient indicator shows number of active practitioners worldwide
- Aggregate coherence visible as subtle gland environmental effect
- Nothing identifying ever transmitted

### Phase 6 acceptance criteria

- [ ] Ceremony of 10 devices holds sync under 100ms drift
- [ ] WebNFC seed handoff works on Android Chrome
- [ ] Fallback URL-based seeding works on iOS
- [ ] Global field visualisation stable with 100+ simulated nodes
- [ ] Session recording exports valid PDF + audio file
- [ ] Post-ceremony report contains all collected metrics

---

## 13. Phase 7 — Oracle & Gates

**Goal:** Magnetic hooks. Reasons to open every day.

### 13.1 Oracle engine

Stratum 4 unlock. After each session:

- `/api/oracle` edge function calls Claude API
- Inputs: cosmic state snapshot, composer seed, user's last 3 sessions, stratum, depth score
- Output: archetypal line (max 20 words) + single symbolic image descriptor
- **Offline fallback**: small cached model (distilled) runs on-device via Onnx Runtime Web

System prompt forbids:
- Predictions, advice, outcomes
- Specific names, dates
- Medical/psychological claims
- English longer than 20 words, non-British spelling

Archive: browsable timeline in IndexedDB. Pro tier: export as vault (File System Access API).

### 13.2 Dream journal

Morning ritual:

- Wake detection (via overnight accel data + time awake)
- Gentle prompt: "Record the dream" (optional, dismissible)
- Voice memo → on-device speech-to-text (WhisperCPP via WASM)
- Archetype classifier extracts themes
- Feeds Oracle seed for that day's first session

Never transmits audio or text.

### 13.3 Lunar returns

Monthly. When Moon returns to natal position (requires Astrara chart link):

- Unique 33-min composition
- Gland glows differently in 24h lead-up
- Push notification 1 hour before
- One-shot — cannot be replayed, archived as echo only

### 13.4 Solar gates

Equinoxes, solstices, eclipses, quarter moons, major conjunctions:

- Pre-composed templates
- Gland visibly distinct (solar = gold flare, lunar = silver)
- Accessible via gate calendar (long-press gland)

### 13.5 Windows of power

Real-time detection:

- Current planetary hour matches user's natal chart ruler
- Schumann Kp elevated
- Moon phase supports active intent pattern

Push notification: "The field is open for 47 minutes." Max one per 24h.

### 13.6 The Echo

Morning home-screen state:

- Yesterday's session as faint after-image over gland
- Skipped day → nothing, just the gland
- Loss aversion without punishment

### 13.7 Pro tier (LemonSqueezy)

**Free:**
- All 6 intents
- Strata 1–2
- 3 sessions/week
- Basic cosmic state
- Camera HRV + mic breath

**Pro (£9.99 one-time** — elevated from Overtone Singer £6.99 to reflect depth):
- All strata 1–7
- Unlimited sessions
- All session lengths (11/22/33/55/66)
- Oracle archive + export
- Dream journal
- WebXR AR chamber
- All wearables (Muse, Polar, Oura, Whoop)
- Practitioner mode + ceremony + seeding
- Session recording + PDF reports
- Global field

**Practitioner tier (£29.99 one-time + £4.99/mo for seeding):**
- Everything in Pro
- Unlimited client seeds (free tier: 3 active)
- Client roster view
- Branded session reports
- Priority in global field

Licence validation via Cloudflare Worker proxy, offline grace 30 days.

### 13.8 Capacitor wrapper (optional, Phase 7 end)

- iOS App Store submission
- Native HealthKit bridge
- Native push
- Same codebase as PWA

### Phase 7 acceptance criteria

- [ ] Oracle never outputs forbidden language across 1000 generations
- [ ] Offline oracle fallback produces usable archetypal language
- [ ] Dream journal never writes audio to disk
- [ ] Lunar return calculation verified against Swiss Ephemeris to 1 arcminute
- [ ] Pro licence persists offline 30 days
- [ ] All Pro gating tamper-resistant (client-side only, honour system, no DRM theatre)

---

## 14. Hexara integration (cross-app)

Pinara can act as a **controller for Hexara** when both are on the same network:

- Pinara discovers Hexara via mDNS (`hexara.local`)
- MIDI-over-network or WebSocket bridge
- Composer sends OSC to Hexara's SuperCollider
- Hexara's 6-speaker VBAP becomes room-scale expression of Pinara's session
- User's phone = gland, room = field

Optional. Flagged as "Connect to Hexara" in Pro practitioner mode. Requires Hexara Phase 3 complete.

---

## 15. Astrara integration

Natal chart linkage unlocks Inner Sky, lunar returns, personalised planetary hours:

- User uploads natal JSON (exported from astrara.app/promo)
- Or links Astrara account (Phase 7+, if accounts ever exist)
- Natal chart stored locally only
- Drives: transit-to-natal detection, personal planetary rulers, astrocartography

---

## 16. Quality bar

Reference: lunata.app, sonarus.app, lunar-practitioner.vercel.app. **Pinara must exceed all three in visual depth, audio sophistication, and session variety.**

- 60fps WebGPU path on iPhone 14+, iPad M-series
- 45fps minimum on iPhone 12 WebGL fallback
- No audio crackling, dropout, silent-first-play (Binara lessons apply — AudioContext resume on user gesture, never auto-play)
- Darkness mode no white-flashes
- All cosmic data verified against Swiss Ephemeris before ship
- British English spell-check pass
- EN/LT parity — no English fallbacks in LT mode
- No scrollbars anywhere
- Plausible analytics: session_start, session_complete, strata_unlock, oracle_received, ceremony_started, seed_issued, wearable_connected, ar_chamber_entered, window_of_power_fired
- No biometric data leaves device ever
- All ML models < 10MB each, cached aggressively

---

## 17. Environment variables (Vercel Production)

```
NEXT_PUBLIC_SITE_URL=https://pinara.app
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=pinara.app
SCHUMANN_FEED_URL=<reuse shumann.app source>
NOAA_SWPC_URL=https://services.swpc.noaa.gov
ANTHROPIC_API_KEY=<Phase 7, Production env>
LEMONSQUEEZY_STORE_ID=<Phase 7>
LEMONSQUEEZY_WEBHOOK_SECRET=<Phase 7>
CLOUDFLARE_WORKER_LICENCE_URL=<Phase 7>
SENTRY_DSN=<from ship>
WEBRTC_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
```

All Vercel envs set to **Production** only.

---

## 18. Deployment notes

- Repo: `RemiDz/pinara`
- DNS: Cloudflare (NOT GitHub Pages — 404 visibility issue pattern)
- Push: `git push origin main`
- No basic auth, production public from day one
- PWA icons required before first deploy
- Service Worker cache strategy: stale-while-revalidate for shell, cache-first for models
- ML model versioning via `/models/v{n}/` paths

---

## 19. Build order

1. `npx create-next-app@latest pinara --typescript --tailwind --app`
2. Install core deps: `three @react-three/fiber @react-three/drei@9.117.3 tone astronomy-engine @mediapipe/tasks-vision @tensorflow/tfjs onnxruntime-web`
3. Scaffold folder tree from Section 5
4. **Phase 1** in order:
   a. Capability detection (`lib/capability.ts`)
   b. CosmicContext + `/api/ephemeris`
   c. Gland WebGL2 fallback first (safer baseline)
   d. Gland WebGPU path (after fallback verified)
   e. IntentSelector
   f. AudioEngine v1 (3 layers)
   g. SessionController
   h. DarknessLayer
   i. PWA manifest + SW
5. Deploy, verify on iPhone + iPad + Android
6. Only then Phase 2.

**Harnesses first**: `/audio-harness`, `/gland-harness`, `/biometric-harness` should be scaffolded early and used continuously for isolated tuning.

---

## 20. Open design decisions

Remigijus to confirm before build:

1. Confirm name: **Pinara** (recommended) or **Noctara** or **Ajnara**?
2. Lengths: 11/22/33 (free) + 55/66 (Pro), or different?
3. Astrara link: JSON upload v1, unified account later?
4. Pro price: £9.99 one-time (recommended) vs subscription?
5. Practitioner tier: £29.99 one-time + £4.99/mo seeding, or pure one-time?
6. Sentry: yes/no (extra dep, but valuable)?
7. Capacitor wrap for App Store: Phase 7 or skip, PWA-only?
8. Launch region: UK/EU first or global immediately?

---

## 21. Non-goals

Explicit exclusions to prevent scope creep:

- No social features (no likes, no sharing except seed codes)
- No gamification (no streaks, badges, leaderboards)
- No advertisements
- No user-to-user messaging
- No biometric cloud sync
- No server-side ML inference
- No dark patterns of any kind
- No content library / track browser

---

**End of spec.** Begin Phase 1. Work autonomously. Build harnesses early. Never compromise depth for speed. Report only when Phase 1 acceptance criteria pass.
