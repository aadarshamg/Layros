"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ShoppableVideo } from "@leyros/types";
import { useCart } from "@/lib/cart-context";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function discountPercent(price: number, compareAtPrice?: number) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round((1 - price / compareAtPrice) * 100);
}

export function VideoShowcaseCarousel({ videos }: { videos: ShoppableVideo[] }) {
  const [openVideo, setOpenVideo] = useState<ShoppableVideo | null>(null);

  return (
    <>
      <div className="mt-8 flex gap-4 overflow-x-auto pb-4 [scrollbar-width:thin] snap-x snap-mandatory">
        {videos.map((video) => (
          <VideoTile key={video.id} video={video} onExpand={() => setOpenVideo(video)} />
        ))}
      </div>
      {openVideo && <VideoShowcaseModal video={openVideo} onClose={() => setOpenVideo(null)} />}
    </>
  );
}

function VideoTile({ video, onExpand }: { video: ShoppableVideo; onExpand: () => void }) {
  const { addItem } = useCart();
  const variant = video.product.variants[0];
  const discount = variant ? discountPercent(variant.price, variant.compareAtPrice) : null;
  const [justAdded, setJustAdded] = useState(false);

  function handleAddToCart(event: React.MouseEvent) {
    event.stopPropagation();
    if (!variant) return;
    addItem({
      productId: video.product.id,
      handle: video.product.handle,
      variantId: variant.id,
      title: video.product.title,
      image: video.product.images[0],
      sizeMl: variant.sizeMl,
      sizeLabel: variant.sizeLabel,
      sku: variant.sku,
      unitPrice: variant.price,
      compareAtPrice: variant.compareAtPrice,
      quantity: 1,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onExpand}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onExpand();
        }
      }}
      className="group relative aspect-9/16 w-48 shrink-0 cursor-pointer snap-start overflow-hidden rounded-3xl bg-charcoal text-left sm:w-56"
    >
      <video
        src={video.videoUrl}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-2">
        {video.creatorHandle && (
          <div className="flex items-center gap-1.5">
            {video.creatorAvatar && (
              <Image src={video.creatorAvatar} alt="" width={20} height={20} className="rounded-full" />
            )}
            <span className="text-xs font-medium text-white drop-shadow">{video.creatorHandle}</span>
          </div>
        )}
        {video.promoBadge && (
          <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-charcoal">
            {video.promoBadge}
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
        <p className="truncate text-sm font-medium">{video.product.title}</p>
        {variant && (
          <p className="mt-0.5 text-sm">
            {formatInr(variant.price)}
            {variant.compareAtPrice && (
              <span className="ml-1.5 text-xs text-white/60 line-through">{formatInr(variant.compareAtPrice)}</span>
            )}
            {discount && <span className="ml-1.5 text-xs font-medium text-emerald-300">{discount}% off</span>}
          </p>
        )}
        <button
          type="button"
          onClick={handleAddToCart}
          className={`video-tile-add mt-2 block w-full cursor-pointer rounded-full border border-white bg-white py-1.5 text-center text-xs uppercase tracking-widest active:scale-95 ${
            justAdded ? "text-offwhite added" : "text-charcoal hover:text-offwhite"
          }`}
        >
          <span className="video-tile-add-label">{justAdded ? "Added ✓" : "Add to cart"}</span>
        </button>
      </div>
    </div>
  );
}

function VideoShowcaseModal({ video, onClose }: { video: ShoppableVideo; onClose: () => void }) {
  const { addItem } = useCart();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [justAdded, setJustAdded] = useState(false);
  const variant = video.product.variants[0];
  const discount = variant ? discountPercent(variant.price, variant.compareAtPrice) : null;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  function toggleMute() {
    setMuted((value) => {
      if (videoRef.current) videoRef.current.muted = !value;
      return !value;
    });
  }

  function handleAddToCart() {
    if (!variant) return;
    addItem({
      productId: video.product.id,
      handle: video.product.handle,
      variantId: variant.id,
      title: video.product.title,
      image: video.product.images[0],
      sizeMl: variant.sizeMl,
      sizeLabel: variant.sizeLabel,
      sku: variant.sku,
      unitPrice: variant.price,
      compareAtPrice: variant.compareAtPrice,
      quantity: 1,
    });
    // Show the confirmed state briefly before closing, rather than
    // vanishing the modal the instant it's clicked with no feedback.
    setJustAdded(true);
    window.setTimeout(onClose, 800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex w-full max-w-3xl overflow-hidden rounded-3xl bg-offwhite shadow-2xl max-sm:flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-charcoal"
        >
          ✕
        </button>

        <div className="relative aspect-9/16 w-full max-w-sm bg-charcoal sm:w-2/5">
          <video
            ref={videoRef}
            src={video.videoUrl}
            autoPlay
            muted={muted}
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            {video.creatorHandle ? (
              <div className="flex items-center gap-1.5">
                {video.creatorAvatar && (
                  <Image src={video.creatorAvatar} alt="" width={24} height={24} className="rounded-full" />
                )}
                <span className="text-sm font-medium text-white drop-shadow">{video.creatorHandle}</span>
              </div>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute video" : "Mute video"}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white"
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
          {video.promoBadge && (
            <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-charcoal">
              {video.promoBadge}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          {video.product.images[0] && (
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-ivory">
              <Image src={video.product.images[0]} alt={video.product.title} fill className="object-cover" />
            </div>
          )}
          <h3 className="mt-4 font-serif text-2xl text-charcoal">{video.product.title}</h3>
          {variant && (
            <p className="mt-1 text-lg text-charcoal">
              {formatInr(variant.price)}
              {variant.compareAtPrice && (
                <span className="ml-2 text-sm text-charcoal-soft/50 line-through">{formatInr(variant.compareAtPrice)}</span>
              )}
              {discount && <span className="ml-2 text-sm font-medium text-emerald-700">{discount}% OFF</span>}
            </p>
          )}
          <p className="mt-3 text-sm text-charcoal-soft/70">{video.product.description}</p>

          <div className="mt-auto flex gap-3 pt-6">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!variant}
              className={`video-modal-add flex-1 cursor-pointer rounded-full border border-charcoal bg-charcoal py-3 text-center text-sm uppercase tracking-widest active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                justAdded ? "text-charcoal added" : "text-offwhite hover:text-charcoal"
              }`}
            >
              <span className="video-modal-add-label">{justAdded ? "Added ✓" : "Add to cart"}</span>
            </button>
            <Link
              href={`/products/${video.product.handle}`}
              className="flex-1 cursor-pointer rounded-full border border-charcoal py-3 text-center text-sm uppercase tracking-widest text-charcoal transition-colors duration-300 ease-out hover:bg-charcoal hover:text-offwhite"
            >
              More info
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
