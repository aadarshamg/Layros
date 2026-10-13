import Image from "next/image";

const PHOTOS: [RegExp, string][] = [
  [/watermelon/i, "watermelon"],
  [/bergamot/i, "bergamot"],
  [/lavender/i, "lavender"],
  [/lotus/i, "lotus"],
  [/jasmine/i, "jasmine"],
  [/sandalwood|sandal/i, "sandalwood"],
  [/amber|resin|benzoin|incense/i, "amber"],
];

/** Ingredient photographs; abstract accords use a fragrance-oil still life. */
export function NoteIcon({ note }: { note: string }) {
  const ingredient = PHOTOS.find(([pattern]) => pattern.test(note))?.[1] ?? "accord";
  return (
    <span className="product-note-icon product-note-photo">
      <Image src={`/leyros/ingredients/${ingredient}.jpg`} alt={ingredient === "accord" ? `Fragrance oils illustrating the ${note} accord` : note} fill sizes="64px" />
    </span>
  );
}
