"use client";

import { useState } from "react";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; message: string };

export function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (rating < 1) {
      setStatus({ kind: "error", message: "Choose a star rating." });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name, rating, comment, website }),
      });
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
