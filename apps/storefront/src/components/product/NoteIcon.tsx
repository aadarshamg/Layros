import type { ReactNode } from "react";

type NoteKind = "citrus" | "fruit" | "floral" | "woody" | "spicy" | "sweet" | "resin" | "aquatic" | "green" | "drop";

// First match wins, so the more specific families come first
// ("orange blossom" is a flower, not a citrus).
const KINDS: [RegExp, NoteKind][] = [
  [/blossom|rose|jasmine|lavender|neroli|iris|violet|orchid|peony|tuberose|lotus|geranium|lily|osmanthus|ylang|magnolia|flor|flower|petal/i, "floral"],
  [/bergamot|lemon|lime|orange|mandarin|grapefruit|citrus|yuzu|tangerine/i, "citrus"],
  [/sea|marine|water|aqua|ocean|rain|mineral|ozon|ice|salt|frost/i, "aquatic"],
  [/apple|pear|peach|pineapple|mango|berr|cherry|currant|passion|melon|fruit|plum|apricot|guava|date|coconut|fig|lychee/i, "fruit"],
  [/vanilla|tonka|caramel|honey|praline|chocolate|cocoa|coffee|cream|sugar|candy|pistachio|almond|truffle/i, "sweet"],
  [/cardamom|pepper|saffron|cinnamon|nutmeg|clove|ginger|spice|anise|licorice/i, "spicy"],
  [/wood|cedar|sandal|oud|agarwood|vetiver|patchouli|birch|moss|pine|fir|guaiac|cypress/i, "woody"],
  [/amber|ambroxan|musk|incense|resin|benzoin|labdanum|leather|tobacco|smoke|suede/i, "resin"],
  [/mint|sage|rosemary|basil|green|herb|tea|leaf|grass|soil|earth|aldehyde/i, "green"],
];

const TONES: Record<NoteKind, { background: string; ink: string }> = {
  citrus: { background: "#fff1cf", ink: "#d58a00" },
  fruit: { background: "#ffe1dd", ink: "#c2413a" },
  floral: { background: "#fde5f0", ink: "#b83b7a" },
  woody: { background: "#efe3d6", ink: "#7a4b22" },
  spicy: { background: "#fbe2d2", ink: "#b5531c" },
  sweet: { background: "#f6e9d6", ink: "#9a6a2f" },
  resin: { background: "#f1e6cf", ink: "#8a6a1f" },
  aquatic: { background: "#dcf0f6", ink: "#1f7a94" },
  green: { background: "#e1f0e3", ink: "#2f7b46" },
  drop: { background: "#eaf0ed", ink: "#1a422f" },
};

const GLYPHS: Record<NoteKind, ReactNode> = {
  // Citrus slice
  citrus: (
    <>
      <circle cx="24" cy="24" r="13" fill="none" strokeWidth="2.5" />
      <path d="M24 13v22M13 24h22M16.2 16.2l15.6 15.6M31.8 16.2 16.2 31.8" strokeWidth="1.6" />
    </>
  ),
  // Round fruit with a leaf
  fruit: (
    <>
      <path d="M24 16c-7-4-13 1-12 9 1 7 6 11 12 9 6 2 11-2 12-9 1-8-5-13-12-9Z" fill="currentColor" stroke="none" />
      <path d="M24 16c0-3 1-5 4-7" fill="none" strokeWidth="2" />
      <path d="M27 11c3-2 6-1 7 1-2 2-5 2-7-1Z" fill="currentColor" stroke="none" />
    </>
  ),
  // Five-petal flower
  floral: (
    <>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cx="24" cy="14.5" rx="5" ry="7.5" fill="currentColor" stroke="none" opacity=".85" transform={`rotate(${angle} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="3.6" fill="#fff" stroke="none" />
    </>
  ),
  // Log with growth rings
  woody: (
    <>
      <rect x="9" y="17" width="24" height="14" rx="7" fill="currentColor" stroke="none" opacity=".35" />
      <ellipse cx="33" cy="24" rx="6" ry="7" fill="currentColor" stroke="none" />
      <ellipse cx="33" cy="24" rx="3" ry="3.6" fill="none" stroke="#fff" strokeWidth="1.4" />
      <path d="M14 21h8M13 27h10" stroke="currentColor" strokeWidth="1.6" />
    </>
  ),
  // Star anise
  spicy: (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <path key={angle} d="M24 24 21.6 11.5 24 9l2.4 2.5Z" fill="currentColor" stroke="none" transform={`rotate(${angle} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="2.6" fill="#fff" stroke="none" />
    </>
  ),
  // Vanilla pods
  sweet: (
    <>
      <path d="M12 34c8-3 16-11 22-22" fill="none" strokeWidth="4" strokeLinecap="round" />
      <path d="M17 37c7-2 14-8 20-17" fill="none" strokeWidth="3" strokeLinecap="round" opacity=".6" />
    </>
  ),
  // Faceted amber stone
  resin: (
    <>
      <path d="M24 10 36 19 31.5 35h-15L12 19Z" fill="currentColor" stroke="none" opacity=".85" />
      <path d="M24 10v25M12 19h24M16.5 35 24 19l7.5 16" fill="none" stroke="#fff" strokeWidth="1.3" opacity=".8" />
    </>
  ),
  // Waves
  aquatic: (
    <>
      <path d="M9 19c4-4 7-4 10 0s6 4 10 0 6-4 10 0" fill="none" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M9 27c4-4 7-4 10 0s6 4 10 0 6-4 10 0" fill="none" strokeWidth="2.6" strokeLinecap="round" opacity=".7" />
      <path d="M9 35c4-4 7-4 10 0s6 4 10 0 6-4 10 0" fill="none" strokeWidth="2.6" strokeLinecap="round" opacity=".4" />
    </>
  ),
  // Leaf
  green: (
    <>
      <path d="M11 37c0-15 9-25 26-26 0 16-9 26-26 26Z" fill="currentColor" stroke="none" opacity=".85" />
      <path d="M11 37 30 18" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  // Droplet
  drop: <path d="M24 9c6 8 10 13 10 18a10 10 0 0 1-20 0c0-5 4-10 10-18Z" fill="currentColor" stroke="none" opacity=".85" />,
};

/** A small tinted ingredient icon for a fragrance note, picked from the note's name. */
export function NoteIcon({ note }: { note: string }) {
  const kind = KINDS.find(([pattern]) => pattern.test(note))?.[1] ?? "drop";
  const tone = TONES[kind];
  return (
    <span className="product-note-icon" style={{ background: tone.background, color: tone.ink }} aria-hidden="true">
      <svg viewBox="0 0 48 48" stroke="currentColor" fill="none" focusable="false">{GLYPHS[kind]}</svg>
    </span>
  );
}
