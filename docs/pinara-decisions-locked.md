# Pinara — Locked Decisions

All open questions from Section 20 of the mega build spec are now locked. Claude Code should treat these as authoritative.

---

## 1. Name: **Pinara**

- Fits the -ara family (Astrara, Lunata, Binara, Sonarus, Voxora)
- Transparent about subject without being clinical
- `pinara.app` domain claimed
- Noctara/Ajnara shelved — could revive as sister apps later

## 2. Session lengths: **11 / 22 / 33 free · 55 / 66 Pro**

- Sacred numbers throughout
- Free tier caps at 33 so Pro has meaningful unlock
- 66-minute sessions reserved for Pro practitioners running ceremonies

## 3. Astrara link: **JSON upload in v1**

- User exports natal JSON from astrara.app/promo → uploads to Pinara once
- Stored in localStorage, drives Inner Sky / lunar returns / personal planetary rulers
- Unified accounts deferred indefinitely — keeps v1 zero-infrastructure
- Re-upload path available if user refreshes their Astrara chart

## 4. Pro price: **£9.99 one-time**

- Elevated from Overtone Singer Pro (£6.99) to reflect depth and cost of flagship
- One-time matches ecosystem convention — no subscription fatigue
- LemonSqueezy checkout, Cloudflare Worker licence validation
- 30-day offline grace window

## 5. Practitioner tier: **£29.99 one-time** (no subscription component)

Dropping the £4.99/mo seeding subscription. Rationale:

- Recurring billing adds infra and customer-service load
- Matches one-time ecosystem convention
- If seed-issuance load becomes a real cost, add a generous monthly quota later (e.g. 20 active seeds/month free, beyond that add-on)
- Start simple, iterate if data demands it

Practitioner unlocks:
- Everything in Pro
- Unlimited client seeds
- Client roster view
- Branded session reports
- Priority in global field

## 6. Sentry: **Yes**

- Free tier, anonymous errors only
- Flagship app — blind deployment is reckless given the complexity
- Strip all biometric payloads from error context (enforce in Sentry beforeSend hook)
- Opt-out toggle in settings for purists

## 7. Capacitor wrapper: **Yes, Phase 7**

- PWA is the primary artefact
- Capacitor wrap purely for App Store presence + native HealthKit + native push
- Same codebase, no divergence
- Android/iOS submissions at end of Phase 7, not before

## 8. Launch region: **Global from day one**

- PWA, zero reason to region-lock
- EN/LT parity at launch
- Further languages (ES for Fuerteventura, FR, DE) post-launch if demand emerges

---

## Additional locked conventions

- **Privacy copy:** all sensor permission prompts follow template: "Pinara uses [sensor] to [specific benefit]. Data never leaves your device." British English throughout.
- **Icon set:** custom, not lucide. The gland family deserves bespoke iconography (commission or generate).
- **Colour system:** deep indigo (#0B0A2E) primary, pineal-gold (#E8B86D) highlight, silver-lunar (#C4CAD0) secondary, true black (#000000) darkness mode. Define as Tailwind theme tokens.
- **Type system:** sans for UI (Inter), serif for Oracle messages (Cormorant Garamond or similar). Oracle type must feel distinct from interface type.
- **Motion:** all transitions 400–800ms easing `cubic-bezier(0.4, 0.0, 0.2, 1)`. No snappy UI. Everything breathes.
- **Error states:** never apologetic copy. Gland visibly softens, short phrase ("the field is quiet"), retry on tap.

---

**These decisions are final unless revisited explicitly. Claude Code should not prompt for confirmation on any of the above during build.**
