"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type TouchEvent } from "react";

type GallerySlide =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster: string };

// Declared outside ProductGallery so a re-render (e.g. touch tracking) never remounts a playing video.
function Slide({ slide, title, number, expanded = false, priority = false, onOpen }: { slide: GallerySlide; title: string; number: number; expanded?: boolean; priority?: boolean; onOpen?: () => void }) {
  if (slide.type === "video") {
    return (
      <video controls muted playsInline preload="metadata" poster={slide.poster} aria-label={`${title} fragrance film`}>
        <source src={slide.src} type="video/mp4" />
      </video>
    );
  }
  return (
    <button type="button" className="product-gallery-open" onClick={() => !expanded && onOpen?.()} aria-label={expanded ? `${title} image` : `View ${title} image full screen`}>
      <Image src={slide.src} alt={`${title} product image ${number}`} fill priority={priority} sizes={expanded ? "100vw" : "(max-width: 900px) 100vw, 65vw"} />
    </button>
  );
}

export function ProductGallery({ title, images, videoUrl }: { title: string; images: string[]; videoUrl?: string }) {
  const slides = useMemo<GallerySlide[]>(() => [
    ...images.map((src) => ({ type: "image" as const, src })),
    ...(videoUrl ? [{ type: "video" as const, src: videoUrl, poster: images[0] }] : []),
  ], [images, videoUrl]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const previous = () => setActiveIndex((index) => (index - 1 + slides.length) % slides.length);
  const next = () => setActiveIndex((index) => (index + 1) % slides.length);
  const previousImage = () => setActiveIndex((index) => (index - 1 + images.length) % images.length);
  const nextImage = () => setActiveIndex((index) => (index + 1) % images.length);

  useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
      if (event.key === "ArrowLeft") setActiveIndex((index) => (index - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setActiveIndex((index) => (index + 1) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreen, images.length]);

  function handleTouchStart(event: TouchEvent) {
    setTouchStart(event.touches[0]?.clientX ?? null);
  }

  function handleTouchEnd(event: TouchEvent) {
    if (touchStart === null) return;
    const distance = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
    if (Math.abs(distance) > 45) {
      if (fullscreen) {
        if (distance > 0) previousImage();
        else nextImage();
      } else if (distance > 0) previous();
      else next();
    }
    setTouchStart(null);
  }

  if (!slides.length) return null;

  const activeSlide = slides[activeIndex];

  return (
    <div className="product-gallery" aria-label={`${title} product gallery`}>
      <div className="product-gallery-stage" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="product-gallery-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {slides.map((slide, index) => (
            <div className="product-gallery-slide" key={`${slide.src}-${index}`} aria-hidden={index !== activeIndex}>
              <Slide slide={slide} title={title} number={index + 1} priority={index === 0} onOpen={() => setFullscreen(true)} />
            </div>
          ))}
        </div>
        <span className="product-gallery-counter">{activeIndex + 1} / {slides.length}</span>
        {slides.length > 1 && (
          <>
            <button type="button" className="product-gallery-arrow is-previous" onClick={previous} aria-label="Previous product image"><span className="ui-chevron is-left" aria-hidden="true" /></button>
            <button type="button" className="product-gallery-arrow is-next" onClick={next} aria-label="Next product image"><span className="ui-chevron is-right" aria-hidden="true" /></button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="product-gallery-thumbnails" aria-label="Choose product image">
          {slides.map((slide, index) => (
            <button type="button" key={`${slide.src}-thumb`} className={index === activeIndex ? "is-active" : undefined} onClick={() => setActiveIndex(index)} aria-label={`Show ${slide.type === "video" ? "video" : `image ${index + 1}`}`}>
              <Image src={slide.type === "image" ? slide.src : slide.poster} alt="" fill sizes="90px" />
              {slide.type === "video" && <span aria-hidden="true">▶</span>}
            </button>
          ))}
        </div>
      )}

      {fullscreen && activeSlide.type === "image" && (
        <div className="product-gallery-fullscreen" role="dialog" aria-modal="true" aria-label={`${title} full-screen image`} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <button type="button" className="product-gallery-close" onClick={() => setFullscreen(false)} aria-label="Close full-screen image">×</button>
          <Slide slide={activeSlide} title={title} number={activeIndex + 1} expanded />
          <span className="product-gallery-fullscreen-counter">{activeIndex + 1} / {images.length}</span>
          {images.length > 1 && (
            <>
              <button type="button" className="product-gallery-arrow is-previous" onClick={previousImage} aria-label="Previous product image"><span className="ui-chevron is-left" aria-hidden="true" /></button>
              <button type="button" className="product-gallery-arrow is-next" onClick={nextImage} aria-label="Next product image"><span className="ui-chevron is-right" aria-hidden="true" /></button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
