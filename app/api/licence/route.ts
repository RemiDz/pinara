/**
 * /api/licence — Phase 7 stub.
 *
 * Real validation lives in a Cloudflare Worker (per locked decisions).
 * Until the Worker's URL is wired into CLOUDFLARE_WORKER_LICENCE_URL,
 * this route accepts any non-empty key as honour-system valid so the
 * Pro UI can be exercised end-to-end. Replace the stub branch with a
 * real worker fetch when credentials are ready.
 */

import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  let body: { key?: string } = {};
  try { body = (await req.json()) as { key?: string }; } catch { /* */ }
  const key = (body.key ?? "").trim();
  if (!key) return NextResponse.json({ ok: false, reason: "missing_key" }, { status: 400 });

  const upstream = process.env.CLOUDFLARE_WORKER_LICENCE_URL;
  if (upstream) {
    try {
      const res = await fetch(upstream, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
        signal: AbortSignal.timeout(4000),
      });
      const data = await res.json();
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ ok: false, reason: "upstream_unreachable" }, { status: 502 });
    }
  }

  // Stub: accept any non-empty key.
  return NextResponse.json({ ok: true, tier: key.startsWith("PRACT-") ? "practitioner" : "pro" });
}
