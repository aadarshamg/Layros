import type { FragranceFamily, PerfumeProduct } from "@leyros/types";

type ScentTheme = {
  background: string;
  surface: string;
  accent: string;
  ink: string;
  mood: string;
  chapter: string;
  ritual: string;
};

const FAMILY_THEMES: Record<FragranceFamily, ScentTheme> = {
  fresh: {
    background: "#dceced",
    surface: "#eef7f5",
    accent: "#277f83",
    ink: "#123d45",
    mood: "Luminous · Airy · Restorative",
    chapter: "Light finds the horizon",
    ritual: "Morning, warm weather, and effortless everyday wear",
  },
  floral: {
    background: "#eadcde",
    surface: "#f8eeee",
    accent: "#a64f68",
    ink: "#4b2732",
    mood: "Radiant · Petalled · Expressive",
    chapter: "Petals after dusk",
    ritual: "Daylight occasions, celebrations, and intimate evenings",
  },
  woody: {
    background: "#cdb79e",
    surface: "#eadfce",
    accent: "#875c32",
    ink: "#30231b",
    mood: "Grounded · Textured · Quietly powerful",
    chapter: "A path through warm woods",
    ritual: "Workdays, cool evenings, and considered occasions",
  },
  oriental: {
    background: "#3b2022",
    surface: "#5a3030",
    accent: "#d09a4d",
    ink: "#fff3dd",
    mood: "Smouldering · Resinous · Magnetic",
    chapter: "Gold beneath the shadows",
    ritual: "Evenings, celebrations, and moments that call for presence",
  },
  gourmand: {
    background: "#5b3830",
    surface: "#805345",
    accent: "#e0b36d",
    ink: "#fff5e8",
    mood: "Velvety · Addictive · Comforting",
    chapter: "Sweetness with a darker edge",
    ritual: "Dates, festive nights, gifting, and slow weekends",
  },
};

const NOTE_IMAGES: Array<[RegExp, string]> = [
  [/bergamot|lemon|lime|orange|citrus|grapefruit|mandarin/i, "/leyros/fleur-oranger.jpg"],
  [/rose|jasmine|floral|flower|tuberose|lavender|iris|violet/i, "/leyros/rose.jpg"],
  // Ingredient shots only — never a bottle, so a note chapter can't show
  // another product's label.
  [/oud|agarwood|wood|sandal|cedar|vetiver|patchouli/i, "/leyros/sandalwood.jpg"],
  [/vanilla|caramel|cocoa|coffee|sweet|tonka|leather|tobacco|smoke|incense|amber|saffron|spice|resin|pepper/i, "/leyros/saffron.jpg"],
];

function titleHash(title: string) {
  return [...title].reduce((value, character) => (value * 31 + character.charCodeAt(0)) % 360, 19);
}

export function getScentStoryTheme(product: PerfumeProduct) {
  const theme = FAMILY_THEMES[product.details.family] ?? FAMILY_THEMES.oriental;
  return { ...theme, angle: `${titleHash(product.title)}deg` };
}

export function scentNoteImage(notes: string[], fallback: string) {
  const noteLine = notes.join(" ");
  return NOTE_IMAGES.find(([pattern]) => pattern.test(noteLine))?.[1] ?? fallback;
}

export function scentStoryNarrative(product: PerfumeProduct, name: string) {
  const { details } = product;
  const top = details.notesTop.slice(0, 2).join(" and ") || "a luminous first impression";
  const heart = details.notesHeart.slice(0, 2).join(" and ") || "a textured heart";
  const base = details.notesBase.slice(0, 2).join(" and ") || "a lingering trail";
  const generated = `${name} begins with ${top}, draws closer through ${heart}, then settles into ${base}. It is composed as a ${details.family} memory: distinctive in character, refined on skin, and made to leave an impression after the moment has passed.`;
  const story = details.story?.trim() || generated;
  return story.length > 520 ? `${story.slice(0, 520).replace(/\s+\S*$/, "")}…` : story;
}
