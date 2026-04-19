/**
 * /promo — hidden marketing page (not linked from main nav per spec §10).
 *
 * Phase 1 ships a minimal landing surface so the route resolves and the
 * "all routes functional" quality bar is met.
 */

export default function Promo() {
  return (
    <main className="min-h-[100dvh] bg-chamber px-6 py-16 text-lunar-silver">
      <div className="mx-auto max-w-2xl space-y-6 font-sans">
        <h1 className="font-oracle text-4xl text-pineal-gold">Pinara</h1>
        <p className="select-text text-lg leading-relaxed text-lunar-silver/85">
          A pineal-gland-centred practice instrument. No two sessions identical, ever.
          Live-composed audio that responds to your biology, the cosmos, and your practice
          history.
        </p>
        <p className="select-text text-sm text-lunar-silver/60">
          Part of the Harmonic Waves family. Privacy-absolute: your biometric data never
          leaves your device.
        </p>
        <a
          href="/"
          className="inline-block rounded-full bg-pineal-gold px-6 py-2 text-xs uppercase tracking-[0.3em] text-indigo-deep"
        >
          Enter the chamber
        </a>
      </div>
    </main>
  );
}
