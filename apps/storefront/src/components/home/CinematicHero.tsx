"use client";

import { useRef, useState } from "react";
import Link from "next/link";

export function CinematicHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleAudio() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    void video.play();
  }

  return (
    <section className="cinematic-hero">
      <video
        ref={videoRef}
        className="cinematic-hero-video"
        autoPlay
        loop
        muted={muted}
        playsInline
        poster="/leyros/nuit-doree-hero.jpg"
        preload="auto"
      >
        <source src="/leyros/perfume-aroma-hero.mp4" type="video/mp4" />
      </video>
      <div className="cinematic-hero-overlay" />
      <div className="cinematic-hero-content">
        <p>L’Art du Flacon · Édition 2026</p>
        <h1 className="sr-only">LEYROS Luxury Fragrance House</h1>
        <Link href="#cinematic-collection" className="cinematic-outline-button">Discover the collection</Link>
      </div>
      <button type="button" className="audio-toggle" onClick={toggleAudio} aria-label={muted ? "Turn on hero audio" : "Mute hero audio"}>
        <span className="audio-icon" aria-hidden="true">{muted ? "×" : "◖"}</span>
        <span>{muted ? "Audio experience" : "Sound on"}</span>
      </button>
      <span className="scroll-cue">Scroll to enter <i /></span>
    </section>
  );
}
