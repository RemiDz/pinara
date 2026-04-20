/**
 * Oracle fallback — curated archetypal lines used when no Claude API
 * key is configured (Phase 7.0 default). Real Claude oracle is
 * gated by `ANTHROPIC_API_KEY` and lives in /api/oracle.
 *
 * Lines obey the same constraints we'd give the Claude system
 * prompt: ≤20 words, archetypal imagery only, no advice, no
 * predictions, British English. Symbol descriptors are short and
 * concrete enough for a procedural sigil renderer.
 */

export type OracleLine = { text: string; symbol: string };

const LINES: readonly OracleLine[] = [
  { text: "The water remembers the shape of every stone it has passed.", symbol: "river_through_stones" },
  { text: "Beneath the bell, an older silence is waiting.", symbol: "bell_and_well" },
  { text: "What the moth circles, the moth becomes.", symbol: "moth_and_flame" },
  { text: "Listen for the door that opens when you stop knocking.", symbol: "open_threshold" },
  { text: "The mountain wears its weather like a coat of returning birds.", symbol: "mountain_birds" },
  { text: "Every breath is a small homecoming.", symbol: "lit_window" },
  { text: "The seed knows the season; the gardener trusts the seed.", symbol: "sown_field" },
  { text: "A bowl is most useful in its emptiness.", symbol: "ceramic_bowl" },
  { text: "Even the sun must set into another country to rise again.", symbol: "horizon_arc" },
  { text: "A path remembers each foot more than the foot remembers it.", symbol: "path_through_grass" },
  { text: "What you cup in your hands is also cupping you.", symbol: "two_hands_water" },
  { text: "The lantern does not envy the dawn.", symbol: "lantern_at_window" },
  { text: "All deltas are the river admitting it has arrived.", symbol: "river_delta" },
  { text: "A drum keeps time; a quiet keeps memory.", symbol: "drum_and_room" },
  { text: "The fire forgets nothing it has burned.", symbol: "ember_grate" },
  { text: "Two birds on one branch — one sings, one listens.", symbol: "two_birds" },
  { text: "Stones beneath the moss have learned a slower patience.", symbol: "moss_stone" },
  { text: "Whatever you tend in the dark will arrive in its own light.", symbol: "midnight_garden" },
  { text: "The harp is hollow; the song is not.", symbol: "harp_silhouette" },
  { text: "A door at the end of a familiar hall is still a door.", symbol: "narrow_hall" },
  { text: "All keys remember their first lock.", symbol: "iron_key" },
  { text: "The tree's roots grow toward the dropped pebble of a thought.", symbol: "rooted_tree" },
];

/** Pick a line deterministically from a numeric seed (so the same
 *  session always returns the same line). */
export function pickOracleLine(seed: number): OracleLine {
  const idx = Math.abs(Math.floor(seed)) % LINES.length;
  return LINES[idx];
}

export const ORACLE_FALLBACK_LINES = LINES;
