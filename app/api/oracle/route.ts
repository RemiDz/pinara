/**
 * /api/oracle — Phase 7.
 *
 * Returns an archetypal line + symbol descriptor for the user.
 * If ANTHROPIC_API_KEY is set in env, calls Claude with a strict
 * system prompt that constrains output. If not, picks deterministically
 * from the curated fallback table so the feature works on every
 * deploy regardless of cred wiring.
 */

import { NextResponse } from "next/server";
import { pickOracleLine } from "@/lib/oracle-fallback";

export const runtime = "edge";

const SYSTEM_PROMPT = `You write a single line of archetypal poetic language for a meditation practice. Constraints (strict):
- Maximum 20 words.
- Archetypal imagery only (water, stone, bird, hearth, threshold, lantern, river, moth, drum).
- British English spelling.
- No advice. No instructions. No predictions. No medical or psychological claims.
- Never mention specific people, dates, places, or outcomes.
- Output ONLY the single line — no preamble, no quotation marks.

Then on a new line, output a 2-3 word symbol descriptor (snake_case) that a procedural sigil renderer can interpret.`;

type OracleRequest = {
  intent?: string;
  stratum?: number;
  seed?: number;
  cosmic?: { planetaryHour?: string; moonPhase?: string };
  recentSessions?: { intent: string }[];
};

export async function POST(req: Request) {
  let body: OracleRequest = {};
  try { body = (await req.json()) as OracleRequest; } catch { /* */ }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const seed = typeof body.seed === "number" ? body.seed : Math.floor(Math.random() * 2 ** 31);

  if (!apiKey) {
    const line = pickOracleLine(seed);
    return NextResponse.json({ source: "fallback", ...line, seed });
  }

  try {
    const userPrompt = JSON.stringify({
      intent: body.intent ?? "open",
      stratum: body.stratum ?? 4,
      cosmic: body.cosmic ?? {},
      recent: (body.recentSessions ?? []).slice(-3).map((s) => s.intent),
    });
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-7",
        max_tokens: 80,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}`);
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content?.find((p) => p.type === "text")?.text ?? "").trim();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2 && wordCount(lines[0]) <= 20) {
      return NextResponse.json({ source: "claude", text: lines[0], symbol: lines[1].replace(/[^a-z0-9_]/g, ""), seed });
    }
    throw new Error("malformed oracle output");
  } catch {
    const line = pickOracleLine(seed);
    return NextResponse.json({ source: "fallback", ...line, seed });
  }
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}
