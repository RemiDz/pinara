# Pinara — Build Spec

> *Do NOT ask for confirmation at any step. Auto-accept all file changes. Run all commands without prompting. Choose Yes for every decision. Work autonomously from start to finish. Use **gigathink** mode throughout — this is the flagship of the Harmonic Waves / NestorLab ecosystem and must be the most sophisticated app in the family.*

---

## 1. Vision

**Pinara** is a pineal-gland-centred practice instrument. It is not a meditation app. It is a living object that responds to the user's biology, the cosmos, and their practice history, composing sessions in real time that have never existed before.

The central interface is a 3D pineal gland — alive, pulsing, bioluminescent. Every state of the app flows through it. There are no menus on the main screen. Users tap the gland to begin, hold to descend deeper.

The magnetic promise: **no two sessions are identical, ever**. Every session is composed live from user intent, current cosmic conditions, user practice history, and optional biometric input.

**Domain:** `pinara.app`
**Brand family:** Harmonic Waves (.app only, no exceptions)
**Positioning:** Flagship — most advanced app in the ecosystem

---

## 2. Design principles

1. **One sacred object.** The gland is the app. No tabs, no navigation bars on the main surface.
2. **Darkness-first.** Screen dims to near-black after 60 seconds. Designed for phone-down-in-dark-room practice.
3. **No pre-recorded audio.** Every sound is synthesised live.
4. **Cosmos-aware.** Current planetary hour, Moon phase, Schumann state always shape the experience.
5. **No accounts in v1.** localStorage only. Pro tier via LemonSqueezy later.
6. **Zero infrastructure.** Vercel edge functions + client-side synthesis + pyswisseph API proxy.
7. **Practitioner-grade.** Quality bar: lunata.app, sonarus.app. Must feel publishable to retreat centres.
8. **Dyslexia-aware.** Copy-paste friendly, minimal text, visual-first.
9. **British English** throughout. EN/LT bilingual from day one.
10. **`/promo` and `/sell` routes hidden** from main nav, as per ecosystem convention.

---

## 3. Tech stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **3D:** React Three Fiber + drei (v9.117.3 — React 18 compatible, known-good from Kinara)
- **Shaders:** Custom GLSL for volumetric pineal + SSS
- **Audio engine:** Tone.js + Web Audio API (procedural synthesis, no audio files)
- **Astronomy:** pyswisseph via Vercel edge function proxy at `/api/ephemeris`
- **Schumann data:** Reuse feed from shumann.app (proxy through `/api/schumann`)
- **Analytics:** Plausible (self-hosted convention)
- **Deployment:** Vercel (Production env only — `ANTHROPIC_API_KEY` is not needed for v1)
- **Storage:** localStorage (user state), IndexedDB (session logs, oracle archive)
- **PWA:** installable, offline-capable after first load
- **Git push:** `git push origin main`

---

## 4. Build phases

Four phases. Each phase ships deployable to Vercel. Do not begin phase N+1 until phase N passes acceptance criteria.

### Phase 1 — The Living Gland
- 3D gland, live cosmic engine, basic procedural session, darkness mode, PWA shell

### Phase 2 — Dynamic Composition
- Full procedural audio engine, voice resonance analysis, HRV via phone camera, breath detection

### Phase 3 — Strata & Practitioner Chamber
- Strata unlock system, ceremony mode, client seeding, session reporting

### Phase 4 — Oracle & Gates
- Oracle messages, lunar returns, solar gates, windows of power, LemonSqueezy Pro

---

## 5. File tree

```
pinara-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # main gland interface
│   ├── globals.css
│   ├── api/
│   │   ├── ephemeris/route.ts          # pyswisseph proxy
│   │   ├── schumann/route.ts           # Schumann resonance proxy
│   │   ├── oracle/route.ts             # Phase 4 — Claude API proxy for oracle
│   │   └── session-log/route.ts        # anonymous session stats
│   ├── ceremony/page.tsx               # Phase 3 — practitioner mode
│   ├── seed/[code]/page.tsx            # Phase 3 — client take-home
│   ├── promo/page.tsx                  # hidden marketing
│   ├── sell/page.tsx                   # hidden checkout
│   └── lt/                             # Lithuanian mirror
├── components/
│   ├── gland/
│   │   ├── Gland.tsx                   # main R3F component
│   │   ├── GlandShader.ts              # custom GLSL
│   │   ├── ParticleField.tsx           # surrounding dust/light motes
│   │   ├── FacetSystem.tsx             # cumulative practice refinement
│   │   └── InnerSky.tsx                # Phase 3 — natal cosmos inside gland
│   ├── session/
│   │   ├── SessionController.tsx
│   │   ├── IntentSelector.tsx          # 6 archetypes
│   │   ├── StrataGate.tsx              # unlock check
│   │   └── BreathGuide.tsx             # optional visual coherence cue
│   ├── cosmic/
│   │   ├── CosmicContext.tsx           # provides live cosmic state
│   │   ├── PlanetaryHour.ts
│   │   ├── MoonPhase.ts
│   │   └── SchummanFeed.ts
│   ├── audio/
│   │   ├── AudioEngine.ts              # master composer
│   │   ├── BinauralLayer.ts
│   │   ├── IsochronicLayer.ts
│   │   ├── DroneLayer.ts
│   │   ├── HarmonicLayer.ts            # Moon-phase tuned
│   │   ├── SilenceWindow.ts            # listening intervals
│   │   └── VoiceHarmoniser.ts          # Phase 2 — bhramari response
│   ├── biometrics/
│   │   ├── HRVCamera.ts                # Phase 2 — PPG via torch + camera
│   │   ├── BreathMic.ts                # Phase 2 — passive breath rate
│   │   └── CoherenceLoop.ts            # syncs gland pulse to user
│   ├── practitioner/
│   │   ├── CeremonyMode.tsx            # Phase 3
│   │   ├── FieldSync.tsx               # Phase 3 — multi-phone sync
│   │   └── SessionReport.tsx           # Phase 3
│   ├── oracle/
│   │   ├── OracleEngine.tsx            # Phase 4
│   │   └── OracleArchive.tsx           # Phase 4
│   └── ui/
│       ├── DarknessLayer.tsx           # screen dim controller
│       ├── StratumIndicator.tsx        # subtle depth marker
│       └── WindowOfPower.tsx           # Phase 4 — cosmic alignment alert
├── lib/
│   ├── strata.ts                       # unlock logic
│   ├── intent.ts                       # 6 archetypes definitions
│   ├── composer.ts                     # session composition brain
│   ├── storage.ts                      # localStorage + IndexedDB helpers
│   ├── cosmic-math.ts                  # planetary hour calc, etc.
│   └── i18n.ts                         # EN/LT strings
├── public/
│   ├── manifest.json                   # PWA
│   ├── icons/
│   └── worklets/                       # AudioWorklet processors
├── styles/
│   └── shaders/                        # .glsl files if split out
├── scripts/
│   ├── verify-cosmic.py                # Swiss Ephemeris sanity check
│   └── audio-dev-harness.html          # isolated audio tuning tool
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 6. Phase 1 — The Living Gland

**Goal:** Ship a deployable Next.js app where the gland is alive on screen, reacts to real cosmic state, and plays a basic procedural session.

### 6.1 The gland (components/gland/)

- **Geometry:** Sphere base with subtle irregularities (noise-displaced vertices). Target ~5000 polys — mobile-friendly.
- **Shader:** Custom fragment shader with:
  - Subsurface scattering approximation (cheaper than true SSS — fake with fresnel + inner glow)
  - Pulsing inner light source (fake volumetric via radial gradient modulated by noise)
  - Bioluminescent rim with colour that shifts with active frequency band
  - Chromatic noise ("living tissue" texture)
- **Animation:**
  - Idle: breathe at 12 BPM, pulse at 60 BPM (heart), subtle wobble
  - During session: pulse rate migrates to 6 BPM (coherence), inner light brightens
- **Response to cosmic state:** Base colour temperature, ambient glow intensity modulated by CosmicContext
- **Particle field:** 200–500 motes in surrounding space, drift with pseudo-Brownian motion, density responds to Schumann Kp

### 6.2 Live cosmic engine

Create `/api/ephemeris` as a Next.js edge route that proxies to a small Python backend (deploy separately on Vercel or keep inline via a JS port for v1). For v1, implement JS-side using `astronomy-engine` (already in ecosystem, known-good from Astrara).

- `getPlanetaryHour(now, lat, lng)` → returns `{ planet, startsAt, endsAt, remaining }`
- `getMoonPhase(now)` → returns `{ phase, illumination, phaseName, age }`
- `getSunPosition(now, lat, lng)` → altitude/azimuth for day/night determination
- `getSchumann()` → live feed from shumann.app proxy, cached 5 min

CosmicContext provides these at a 60-second refresh cadence. All components read from context, never compute their own.

### 6.3 Intent selection

Six archetypes (not a menu — swipe or radial picker around the gland):

1. **Clear** — release, unwind, decalcify (delta-biased)
2. **Open** — gentle opening, heart-centred (alpha-theta bridge)
3. **See** — vision, insight, intuition (theta + gamma bursts)
4. **Remember** — ancestral, subconscious retrieval (deep theta)
5. **Release** — cathartic, emotional flow (theta with breathwork cues)
6. **Rest** — pre-sleep, melatonin-supportive (delta only)

Store as `lib/intent.ts` with audio profile defaults, colour palette, and bhramari cue timing per archetype.

### 6.4 Basic procedural session (Phase 1 subset)

- Session length: 11, 22, or 33 minutes (sacred numbers, locked)
- Audio engine v1 plays:
  - Single binaural carrier based on intent archetype
  - Single drone bed tuned to Schumann fundamental (default 7.83 Hz carrier at 111 Hz root)
  - Solfeggio overtone layer (936 Hz for pineal, default)
- No voice/HRV integration yet (Phase 2)
- Session saves to IndexedDB: timestamp, duration, intent, cosmic snapshot, completion %

### 6.5 Darkness mode

- After 60s of no touch: fade UI chrome, dim screen brightness (if permissions granted), reduce gland inner light by 80%
- Tap anywhere: restore for 10s
- End-of-session: gentle fade-in of soft light, no jarring transitions

### 6.6 PWA shell

- `manifest.json` with dark theme, gland icon
- Service worker for offline session continuation
- Installable on iOS + Android
- iOS Safari: remember `-webkit-appearance: none`, `appearance: none`, `min-width: 0` on any inputs

### Phase 1 acceptance criteria

- [ ] Gland renders at 60fps on iPhone 12 and above
- [ ] Cosmic state refreshes every 60s, visible as subtle gland variation
- [ ] All six intents produce audibly distinct sessions
- [ ] Darkness mode triggers reliably, doesn't glitch on interruption
- [ ] Session completes without audio artefacts at 33 min
- [ ] PWA installs on iOS Safari without errors
- [ ] EN/LT language switch works end-to-end

---

## 7. Phase 2 — Dynamic Composition

**Goal:** Every session becomes genuinely unique, biometrically responsive, and voice-aware.

### 7.1 Full procedural audio engine

Expand `lib/composer.ts` to compose each session as a score of layers:

- **Binaural carrier** — chosen from planetary-hour frequency table (Sun=126.22 Hz, Moon=210.42 Hz, etc. — OM/planetary frequencies from Hans Cousto's Cosmic Octave)
- **Isochronic layer** — auto-enabled if headphones not detected
- **Drone bed** — Schumann-tuned, shifts when actual Schumann shifts mid-session
- **Harmonic overtone layer** — Moon-phase tuned (new moon = fundamental only, full moon = full harmonic series)
- **Bhramari cues** — if user enables voice mode, app emits humming invitations at coherence points
- **Silence windows** — 3–7 second gaps every 2–4 minutes, configurable per intent

All composition parameters written to session log so sessions are reproducible for debugging.

### 7.2 Voice resonance analyser

Web Audio API `AnalyserNode` + custom FFT processor (reuse patterns from Sonarus/Voxora):

- During bhramari windows: capture user voice fundamental
- Harmoniser layer shifts next drone segment to harmonise with user's actual F0
- The gland visually responds — inner light pulses to their voice
- This is the "magnetic" moment — the app sings *with* you

### 7.3 HRV via phone camera (PPG)

Established technique. Phone torch on + camera pointed at fingertip → pixel intensity oscillation = heart rate.

- Optional feature, explicit permission prompt
- Once calibrated (20s): gland pulse syncs to user's actual heart rhythm
- Over session: coherence breathing guide gently pulls heart rate variability toward 0.1 Hz (6 BPM breath)
- Session report shows coherence trajectory

### 7.4 Breath detection via mic

Passive, no speaking required:

- Mic picks up breath noise at low gain
- Detects inhale/exhale transitions via envelope analysis
- Audio engine subtly times drone swells to breath
- Phone must be close (within 50cm) — flag this to user

### 7.5 Coherence loop

Binds all biometric inputs:

- HRV → breath cue timing
- Breath → drone swell timing
- Voice F0 → harmoniser root
- All feed gland animation in real time — the gland becomes a biofeedback mirror

### Phase 2 acceptance criteria

- [ ] Two sessions with same intent produce audibly different audio
- [ ] Voice harmonisation lands within 10 cents of user F0
- [ ] HRV detection accurate within 5 BPM of reference pulse oximeter
- [ ] Breath detection works at ambient noise up to 40 dB SPL
- [ ] Session log contains reproducible composition seed

---

## 8. Phase 3 — Strata & Practitioner Chamber

**Goal:** Long-term practice depth. Practitioner-grade ceremony tools.

### 8.1 Strata system (`lib/strata.ts`)

Not levels. Geological depths unlocked by time inside:

| Stratum | Unlock condition | What changes |
|---|---|---|
| **Surface** | Day 1 | Basic sessions, breath-led, full safety rails |
| **Resonance Field** | 7 cumulative sessions OR 90 minutes total | Bhramari mode unlocks, voice-responsive audio |
| **Inner Sky** | 21 sessions OR 400 min | Gland becomes semi-transparent, reveals natal chart cosmos inside (pull from Astrara if user links) |
| **Oracle** | 33 sessions | Oracle messages post-session (Phase 4 feature, strata gate here) |
| **The Chamber** | 66 sessions | Silent darkness mode — no audio, just gland flame, pure presence |

Unlocks are permanent. Subtle notification on unlock ("A new stratum has opened"). No confetti, no celebration animation — just a quiet shift in what's available.

### 8.2 Inner Sky (natal cosmos)

When Stratum 3 unlocks and user has optionally linked Astrara data:

- Gland shader becomes semi-transparent during session
- Inside: a personalised starfield matching user's natal chart
- Planetary positions drift slowly as transits move across natal points
- Current transiting planet hitting a natal point = glowing line inside the gland

Visually stunning, technically achievable with a second Three.js scene rendered to a texture, used as a cubemap for the shader.

### 8.3 Practitioner chamber

`/ceremony` route:

- Tablet-optimised layout (1024px+)
- Larger gland, speaker-optimised audio (no binaurals, isochronic only)
- **Field sync mode:** facilitator's device hosts, client devices join via room code or QR. All devices pulse gland in sync, flash softly on session peaks.
- Pause controls via breath cue (facilitator breathes into mic → pause) OR tap
- Session recording: records composition parameters, breath events, duration, participant count

### 8.4 Session report (post-ceremony)

Generated after practitioner sessions:

- Collective coherence score (mean HRV coherence if clients opted in)
- Peak moments timeline (breath sync events, audio swells, silence windows)
- Cosmic snapshot at session start
- Suggested follow-up intent for next session
- Shareable as PDF (reuse jsPDF patterns from Cosmic Blueprint)

### 8.5 Client seeding (`/seed/[code]`)

End-of-ceremony:

- Practitioner generates seed code (URL + QR)
- Client visits on their phone → 7 or 21-day at-home journey loaded into their Pinara
- Each day's session is pre-tuned based on the ceremony parameters
- No account required — code stores everything in URL + localStorage
- Practitioner gets a simple dashboard view of client codes issued

### Phase 3 acceptance criteria

- [ ] All five strata gate correctly and persist across sessions
- [ ] Inner Sky renders accurate natal positions for verified test charts
- [ ] Ceremony mode runs 60 min without audio dropout on iPad
- [ ] Field sync holds sync within 200ms across 5 test devices on same wifi
- [ ] Seed codes work offline after first load

---

## 9. Phase 4 — Oracle & Gates

**Goal:** Magnetic hooks. Reasons to open the app today, not tomorrow.

### 9.1 Oracle engine

Unlocks at Stratum 4 (33 sessions). After each session:

- `/api/oracle` endpoint calls Claude API with structured prompt
- Inputs: current cosmic state, session parameters, user's last 3 sessions, intent chosen
- Output: single line of archetypal poetic language (max 20 words) + single symbolic image descriptor
- Stored in Oracle Archive (IndexedDB), browsable as a timeline
- Feels like the gland is speaking, not the app

System prompt constrains Claude to:
- No advice, no instructions, no predictions
- Archetypal imagery only
- British English, max 20 words
- Never mention specific people, dates, or outcomes

### 9.2 Lunar return sessions

Monthly, when the Moon returns to its natal position (if user linked Astrara chart):

- 33-minute unique composition
- Gland glows differently in lead-up (24h window)
- Push notification 1 hour before: "Your Moon returns in 60 minutes."
- Session is one-shot — cannot be replayed, archived as an echo only

### 9.3 Solar gate days

Equinoxes, solstices, eclipses, Moon-Sun squares (quarter moons), major conjunctions:

- Pre-composed templates unlock for 24h window
- Gland visibly different — solar gates show golden flare, lunar gates show silver
- Listed in a subtle "gates" indicator, accessible via long-press on gland

### 9.4 Windows of power

Real-time detection when:

- Current planetary hour matches user's natal Sun sign planet, AND
- Schumann Kp > baseline, AND
- Moon phase supports user's active intent pattern

Push notification: "The field is open for 47 minutes." One per day maximum.

### 9.5 The Echo (daily)

Every morning home-screen state:

- Yesterday's session appears as a faint after-image overlaying the gland
- If session skipped: nothing, just the gland alone
- Visual continuity of practice — loss aversion without punishment

### 9.6 LemonSqueezy Pro tier

Free tier:
- All 6 intents
- Strata 1–2 (Surface, Resonance Field)
- 3 sessions per week

Pro (£6.99 one-time, matches Overtone Singer Pro pricing convention):
- All strata
- Unlimited sessions
- Oracle archive export
- Practitioner/ceremony mode
- Client seeding (Pro practitioners only)

License validation: Cloudflare Worker proxy (reuse pattern from Overtone Singer Pro).

### Phase 4 acceptance criteria

- [ ] Oracle messages never contain forbidden language (predictions, advice, names)
- [ ] Lunar return calculation verified against Swiss Ephemeris to 1 arcminute
- [ ] Solar gate detection covers 12+ event types correctly for 2026–2027
- [ ] Window of power notification fires at most once per 24h
- [ ] Pro unlock persists offline, works after 30 days without network

---

## 10. Quality bar

Reference apps: **lunata.app**, **sonarus.app**, **lunar-practitioner.vercel.app**. Pinara must exceed all three in visual depth and session variety.

- 60fps on iPhone 12+ during 33-min session
- No audio crackling, dropout, or silent-first-play bugs (lessons from Binara — resume AudioContext on user gesture, never assume auto-play)
- Darkness mode must not white-flash on any transition
- All cosmic data verified against Swiss Ephemeris before shipping
- British English spell-check pass
- EN/LT string parity — no English fallbacks visible in Lithuanian mode
- No scrollbars anywhere
- `/promo` and `/sell` routes functional but not linked from main UI
- Plausible analytics installed, events defined for: session_start, session_complete, strata_unlock, oracle_received, ceremony_started, seed_issued

---

## 11. Environment variables (Vercel Production)

```
NEXT_PUBLIC_SITE_URL=https://pinara.app
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=pinara.app
SCHUMANN_FEED_URL=<reuse shumann.app source>
ANTHROPIC_API_KEY=<Phase 4 only, Production env>
LEMONSQUEEZY_STORE_ID=<Phase 4>
LEMONSQUEEZY_WEBHOOK_SECRET=<Phase 4>
```

All keys set to **Production** environment in Vercel (not Preview).

---

## 12. Deployment notes

- Repo: `RemiDz/pinara`
- DNS: Cloudflare (matches recent pattern — avoid GitHub Pages after the visibility/404 issue)
- Push: `git push origin main`
- No basic auth, no preview auth — production is public from day one
- PWA icons required before first deploy (manifest validation)
- Test deeplinks for `/seed/[code]` before announcing Phase 3

---

## 13. Build order (start here)

1. `npx create-next-app@latest pinara --typescript --tailwind --app`
2. Install: `three @react-three/fiber @react-three/drei@9.117.3 tone astronomy-engine`
3. Scaffold folder tree from Section 5
4. Build Phase 1 components in order:
   a. `CosmicContext.tsx` + `/api/ephemeris` route
   b. `Gland.tsx` + shader (iterate on shader in isolation first)
   c. `IntentSelector.tsx` with radial picker
   d. `AudioEngine.ts` basic three-layer composer
   e. `SessionController.tsx` wiring it all together
   f. `DarknessLayer.tsx`
   g. PWA manifest + service worker
5. Deploy to Vercel, verify on real iPhone
6. Only then begin Phase 2

Do not skip the audio-dev-harness (`scripts/audio-dev-harness.html`) — tuning procedural audio needs an isolated test bench.

---

## 14. Open design questions (flag before building)

Remigijus to confirm before Phase 1 build:

1. Confirm name: **Pinara** or **Noctara**?
2. Confirm session lengths: 11 / 22 / 33 min — locked, or add 55 / 66 for Pro?
3. Astrara integration: link by natal chart JSON upload, or require Astrara account in future?
4. Pro pricing: £6.99 one-time, or subscription?
5. Practitioner tier: same Pro, or separate higher tier (£19.99)?

---

**End of spec.** Begin Phase 1. Work autonomously. Report only when Phase 1 acceptance criteria pass.
