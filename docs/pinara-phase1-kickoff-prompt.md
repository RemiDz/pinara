# Pinara — Phase 1 Kickoff Prompt

> Paste this prompt into Claude Code from within the `pinara.app` folder. Attach `pinara-mega-build-spec.md` and `pinara-decisions-locked.md` to the same context.

---

Do NOT ask for confirmation at any step. Auto-accept all file changes. Run all commands without prompting. Choose Yes for every decision. Work autonomously from start to finish. Use **gigathink** mode throughout — this is the flagship of the Harmonic Waves ecosystem and must be the most sophisticated app in the family.

---

## Context

You are building **Pinara** — a pineal-gland-centred practice instrument. The full architecture is in `pinara-mega-build-spec.md`. All open decisions are resolved in `pinara-decisions-locked.md`. Read both fully before writing a single line of code.

Name: **Pinara**. Domain: **pinara.app**. Repo: **RemiDz/pinara**.

---

## Your task: complete Phase 1 (Foundation)

Phase 1 goal: ship a deployable Next.js PWA where the 3D pineal gland is alive on screen, reacts to real cosmic state (planetary hour, Moon phase, Schumann resonance), and plays a basic procedural session composed of three audio layers.

Do **not** attempt Phases 2–7 in this run. Stop when Phase 1 acceptance criteria pass.

---

## Phase 1 scope (from Section 7 of spec)

1. Next.js 14 + TypeScript + Tailwind scaffold
2. Folder tree per Section 5 of spec — scaffold **all** folders now, even empty ones for later phases, so file paths in the spec hold
3. Capability detection (`lib/capability.ts`) — WebGPU, Web Audio, DeviceOrientation, etc.
4. CosmicContext with live planetary hour / Moon phase / Schumann / solar wind
5. `/api/ephemeris` edge route using `astronomy-engine` (client-side planetary calcs)
6. `/api/schumann` edge route proxying the shumann.app feed
7. Gland WebGL2 fallback first (`GlandWebGL.tsx`) — build the safer path first
8. Gland WebGPU path (`GlandWebGPU.tsx`) — only after fallback works
9. `GlandContainer.tsx` — capability-detects and routes to correct path
10. Particle field surrounding the gland
11. IntentSelector — radial picker around the gland, 6 archetypes from `lib/intent.ts`
12. AudioEngine v1 — three-layer composer (binaural + drone + solfeggio overtone) via AudioWorklet scaffolding
13. SessionController — orchestrates intent → composer → audio + gland state
14. DarknessLayer — 60s idle → screen dim, AmbientLightSensor check
15. Wake Lock active during sessions
16. PWA shell — manifest, service worker, maskable icons, iOS splash
17. EN/LT i18n scaffolding (`lib/i18n.ts`) with all Phase 1 strings
18. Dev harnesses: `/audio-harness`, `/gland-harness`, `/biometric-harness` (empty scaffolds OK, will populate in later phases)
19. Plausible analytics wired (events: `session_start`, `session_complete`)
20. Sentry wired with biometric-payload stripping (per locked decisions)

---

## Non-goals for Phase 1 (do these in later phases)

- No biometrics beyond ambient light
- No WebXR
- No wearables
- No WebRTC / ceremony mode
- No Oracle
- No sacred geometry layers
- No Pro tier / LemonSqueezy
- No NFC
- No WebMIDI

If you are tempted to add any of the above "while you're there", stop and move on.

---

## Working style

- **One step at a time.** Do not skip ahead. This is consistent with how Remigijus works across Astrara, Hexara, Kinara.
- **Enable copy-paste** in all UI (dyslexia-aware).
- **Never re-ask established facts** — everything is in the spec + decisions files.
- **British English** throughout. No American spellings.
- **Build harnesses first** — `/gland-harness` should be functional before the main `/` page is finalised. Shader tuning needs isolation.
- **WebGL path before WebGPU** — WebGPU is the ceiling, WebGL is the floor. Floor must hold before you raise the ceiling.
- **Commit at each milestone** with clear messages: `Phase 1.1: capability detection`, `Phase 1.2: cosmic engine`, etc.
- **Do not run `npm audit fix --force`** or anything that touches lockfiles beyond install/add.

---

## Acceptance criteria (Section 7.7 of spec)

You are not done with Phase 1 until **all** of these pass on a real device test:

- [ ] WebGPU path renders at 60fps on M2 iPad / iPhone 14+ (test via Vercel deploy + physical device)
- [ ] WebGL fallback renders at 60fps on iPhone 12
- [ ] All six intents produce audibly distinct sessions (A/B verify by ear)
- [ ] Cosmic state live — planetary hour, Moon phase, Schumann verified against external source (Swiss Ephemeris via `scripts/verify-cosmic.py`, shumann.app for resonance)
- [ ] Darkness mode reliable — no white flashes on transitions
- [ ] 33-minute session completes without audio artefacts or dropout
- [ ] PWA installs cleanly on iOS Safari 17+ and Android Chrome
- [ ] EN/LT parity — no English fallbacks visible in LT mode

When all eight criteria pass, report back with:
- Deployed URL (should be `https://pinara.app` via Vercel + Cloudflare DNS)
- Device test matrix (which devices tested, what passed/failed)
- Any deviations from spec and why
- Ready-for-Phase-2 confirmation

---

## First concrete steps

1. `npx create-next-app@latest pinara --typescript --tailwind --app --src-dir=false`
2. Install Phase 1 deps:
   ```
   npm install three @react-three/fiber @react-three/drei@9.117.3 tone astronomy-engine
   npm install -D @types/three @types/web
   ```
3. Scaffold full folder tree from Section 5 of spec (empty stub files OK for later-phase folders)
4. Configure Tailwind with locked colour tokens (indigo `#0B0A2E`, pineal-gold `#E8B86D`, silver-lunar `#C4CAD0`, true black)
5. Initialise git, first commit
6. Build `lib/capability.ts` — static feature detection returning a capability matrix
7. Build CosmicContext with astronomy-engine planetary hour math
8. Build `/api/ephemeris` route (edge runtime)
9. Build `/api/schumann` route (reuse shumann.app feed)
10. Move to gland harness and WebGL fallback shader

---

## Reminders

- `git push origin main` (not master) — this is a new repo
- Vercel envs all **Production** — no Preview-only variables
- Cloudflare DNS, not GitHub Pages
- No `basic-auth` middleware on production — this is a public launch
- All Skills packaged via skill-creator if any reusable patterns emerge

---

Begin now. Work through every step. Report when Phase 1 is complete and all acceptance criteria pass.
