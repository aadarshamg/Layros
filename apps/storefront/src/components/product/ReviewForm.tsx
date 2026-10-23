"use client";

import { useState } from "react";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; message: string };

const MAX_PHOTOS = 3;
const MAX_VIDEO_BYTES = 4 * 1024 * 1024;

/** Shrinks a photo to at most 1600px as a JPEG, so a few fit in one upload. */
async function shrinkPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return blob ? new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [media, setMedia] = useState<File[]>([]);

  async function addMedia(files: FileList | null) {
    const picked = [...(files ?? [])];
    const photos = [...media.filter((file) => file.type.startsWith("image/")), ...(await Promise.all(picked.filter((file) => file.type.startsWith("image/")).map(shrinkPhoto)))];
    const videos = [...media.filter((file) => file.type.startsWith("video/")), ...picked.filter((file) => file.type.startsWith("video/"))];
    if (videos.some((file) => file.size > MAX_VIDEO_BYTES)) {
      setStatus({ kind: "error", message: "Videos can be up to 4 MB. Please trim it to a short clip." });
      return;
    }
    if (photos.length > MAX_PHOTOS || videos.length > 1) setStatus({ kind: "error", message: `Add up to ${MAX_PHOTOS} photos and 1 video.` });
    else setStatus({ kind: "idle" });
    setMedia([...photos.slice(0, MAX_PHOTOS), ...videos.slice(0, 1)]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (rating < 1) {
      setStatus({ kind: "error", message: "Choose a star rating." });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const form = new FormData();
      form.set("productId", productId);
      form.set("name", name);
      form.set("rating", String(rating));
      form.set("comment", comment);
      form.set("website", website);
      for (const file of media) form.append("media", file);
      const response = await fetch("/api/reviews", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus({ kind: "error", message: data.error ?? "Could not submit your review. Please try again." });
        return;
      }
      setStatus({ kind: "done" });
    } catch {
      setStatus({ kind: "error", message: "Could not submit your review. Please try again." });
    }
  }

  if (status.kind === "done") {
    return <p className="review-form-thanks">Thank you! Your review has been received and will appear once it&apos;s approved.</p>;
  }

  if (!open) {
    return (
      <button type="button" className="review-write-button" onClick={() => setOpen(true)}>
        Write a review
      </button>
    );
  }

  const shown = hover || rating;

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <fieldset className="review-form-stars">
        <legend>Your rating</legend>
        <div onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={value <= shown ? "is-on" : undefined}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
              onMouseEnter={() => setHover(value)}
              onClick={() => setRating(value)}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <label className="review-form-field">
        <span>Your name</span>
        <input required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
      </label>
      <label className="review-form-field">
        <span>Your review (optional)</span>
        <textarea rows={4} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How does it wear? How long does it last?" />
      </label>
      <div className="review-form-field review-form-media">
        <label htmlFor={`review-media-${productId}`}>Add photos or a video (optional)</label>
        <input id={`review-media-${productId}`} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" multiple onChange={(event) => { void addMedia(event.target.files); event.target.value = ""; }} />
        <small>Up to {MAX_PHOTOS} photos and one video (4 MB).</small>
        {media.length > 0 && (
          <ul>
            {media.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                {file.type.startsWith("video/") ? "Video" : "Photo"}: {file.name}
                <button type="button" onClick={() => setMedia((current) => current.filter((_, i) => i !== index))} aria-label={`Remove ${file.name}`}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <label className="review-form-honeypot" aria-hidden="true">
        Website
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </label>
      {status.kind === "error" && <p className="review-form-error">{status.message}</p>}
      <div className="review-form-actions">
        <button type="submit" disabled={status.kind === "sending"}>{status.kind === "sending" ? "Submitting…" : "Submit review"}</button>
        <button type="button" className="is-secondary" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <p className="review-form-note">Reviews are checked by our team before they appear.</p>
    </form>
  );
}
