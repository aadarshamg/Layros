import Image from "next/image";
import { getNoteImage } from "@/lib/note-images";

/** An unknown note stays text-only rather than showing an unrelated ingredient. */
export function NoteIcon({ note }: { note: string }) {
  const image = getNoteImage(note);
  if (!image) return <span className="product-note-icon" aria-hidden="true" />;
  return (
    <span className="product-note-icon product-note-photo">
      <Image src={image.src} alt={image.alt} fill sizes="(max-width: 600px) 72px, 88px" />
    </span>
  );
}
