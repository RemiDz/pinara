/**
 * /sell — hidden checkout (LemonSqueezy wired in Phase 7).
 *
 * Phase 1 placeholder.
 */

export default function Sell() {
  return (
    <main className="min-h-[100dvh] bg-chamber px-6 py-16 text-lunar-silver">
      <div className="mx-auto max-w-md space-y-4 font-sans">
        <h1 className="font-oracle text-3xl text-pineal-gold">Pinara Pro</h1>
        <p className="select-text text-sm text-lunar-silver/85">
          £9.99 one-time. All strata, unlimited sessions, oracle archive,
          practitioner mode. Available later this year.
        </p>
        <a
          href="/"
          className="inline-block text-xs uppercase tracking-[0.3em] text-lunar-silver/60 hover:text-lunar-silver"
        >
          Back to the chamber
        </a>
      </div>
    </main>
  );
}
