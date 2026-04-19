# Pinara — Phase 2 Kickoff Prompt

> Phase 2 is too large for a single autonomous session. This document
> splits it into 2.0 (this run) and 2.1+ (subsequent runs), and locks
> the scope of each.

---

## Phase 2 — Biometric Consciousness (full)

Mega spec §8 lists seven simultaneous biometric streams plus three
on-device ML classifiers and a fusion loop. That's a multi-session
build because:

1. MediaPipe Face Landmarker is ~10 MB of model + WASM that needs
   careful lazy-loading and hosting strategy.
2. The TensorFlow.js classifiers (meditation state / breath pattern /
   voice emotion) need labeled training data that we don't have yet —
   a separate offline pipeline.
3. iOS Safari blocks none of the camera/mic/motion APIs (good), but
   permission UX for sustained sessions needs careful handling per
   stream.

So we ship in tranches.

---

## Phase 2.0 — first three streams + fusion infrastructure

**Goal.** Permissioned, capability-gated biometric pipeline with two
live streams (HRV + breath) and the fusion + integration plumbing the
remaining streams will plug into.

**In scope.**

1. Permission infrastructure
   - `lib/permissions.ts` — typed permission state per resource
     (camera / microphone / motion / geolocation / notifications),
     persisted in localStorage so we never re-prompt within one device.
   - Enhanced `components/ui/PermissionPrompt.tsx` with bilingual copy
     templates (`permission.<resource>.prompt` keys).

2. `BiometricContext` provider
   - Single subscription point exposed via `useBiometrics()`.
   - Capability-gated: components render no biometric UI when
     `caps.hasMediaDevices` is false (iOS in-app browsers, locked-down
     enterprise builds).
   - Lifecycle: streams attach when permission granted + session
     active, detach on session end.

3. Stream 1 — HRV via camera PPG (`components/biometrics/HRVCamera.ts`)
   - `getUserMedia({ video: { facingMode: 'environment', advanced: [{ torch: true }] } })`.
   - Pixel sampling: mean of red channel from a centred ROI (64x64).
   - DC removal + 0.5–3 Hz bandpass.
   - Peak detection (adaptive threshold + minimum interval).
   - Output: `{ bpm, rrIntervals, lastBeatAt, signalQuality }`.

4. Stream 2 — Breath rate via microphone (`components/biometrics/BreathMic.ts`)
   - `getUserMedia({ audio })` + custom AudioWorklet envelope follower.
   - Onset detection on the smoothed envelope → inhale / exhale events.
   - Output: `{ bpm, lastInhaleAt, lastExhaleAt, ratio, signalQuality }`.

5. `CoherenceLoop` (`components/biometrics/CoherenceLoop.ts`)
   - Fuses HRV + breath (Phase 2.1 will add voice + face).
   - `coherence`: 0–100 from how well breath frequency matches the
     HRV oscillation frequency.
   - `depth`: 0–100 weighted blend of HRV stability + breath
     regularity.

6. Gland integration
   - When HRV is live, `GlandWebGL`'s `uPulse` derives from the
     measured BPM (capped). Falls back to the synthetic 60 BPM when
     no signal.

7. Functional `/biometric-harness`
   - Real permission prompts for camera + mic.
   - Live BPM displays for HRV + breath.
   - Recent-beat trace for HRV; envelope trace for breath.
   - Coherence + depth scores in big readable type.

8. Tests
   - Deterministic vectors for peak detection (synthetic PPG signal
     with known BPM → assert detector recovers it within ±2 BPM).
   - Envelope follower constants (attack/release time correctness).
   - CoherenceLoop math given fixed HRV/breath inputs.

**Out of scope, deferred to Phase 2.1+.**

- Voice F0 via YIN AudioWorklet (Stream 3)
- MediaPipe face mesh (Stream 4)
- Eye tracking + pupil dilation (Streams 5–6, derived from face mesh)
- Posture via DeviceMotion (Stream 7)
- TensorFlow.js classifiers (meditation state / breath pattern / voice emotion)
- ONNX Runtime Web fallback path
- Wearable input (Phase 5 scope, not Phase 2)
- Recording / session report integration (Phase 3 scope)

---

## Working style — same as Phase 1

- One step at a time.
- Capability detection mandatory before any sensor access.
- Permission copy templates: bilingual EN/LT, follow §"Privacy copy"
  in `pinara-decisions-locked.md` ("Pinara uses [sensor] to [specific
  benefit]. Data never leaves your device.").
- All processing on-device. **No biometric data crosses the network.**
- Sentry beforeSend already strips ~25 biometric keys; double-check
  the new key names land in that list.
- British English throughout. EN/LT parity test must continue to pass.
- Commit at each milestone.

---

## Phase 2.0 acceptance criteria

- [ ] Permissions never re-prompt once persisted (granted or denied).
- [ ] HRV camera produces a BPM within ±5 of a reference pulse oximeter.
      *(Awaiting device test — verify on phone with finger on torch.)*
- [ ] Breath mic detects breaths within ±2 BPM of manual count.
      *(Awaiting device test — verify with phone within 50 cm.)*
- [ ] Coherence score reaches >70 when breathing at the intent's
      target BPM with steady HRV.
- [ ] No biometric data written to disk; Sentry breadcrumbs sanitised.
- [ ] App functions normally if user declines all permissions.
- [ ] EN/LT permission copy parity (vitest assertion).
- [ ] No regression in Phase 1 acceptance criteria.

When those pass, Phase 2.1 begins (voice F0 + ML classifiers).
