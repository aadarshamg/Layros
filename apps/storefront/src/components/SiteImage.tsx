"use client";

import NextImage, { type ImageLoader, type ImageProps } from "next/image";

/**
 * next/image, but Sanity photos are resized by Sanity's own image CDN
 * (width, quality, WebP/AVIF via auto=format) instead of Vercel's image
 * optimisation, whose Hobby quota runs out: once it does, every newly
 * uploaded photo fails with 402. Other images keep the default loader, so
 * their already-optimised copies stay cached. (A global loaderFile would turn
 * Vercel's /_next/image off for those too.)
 */
const sanityLoader: ImageLoader = ({ src, width, quality }) => {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality || 75));
  url.searchParams.set("fit", "max");
  url.searchParams.set("auto", "format");
  return url.toString();
};

export default function Image(props: ImageProps) {
  const isSanity = typeof props.src === "string" && props.src.startsWith("https://cdn.sanity.io/images/");
  return <NextImage {...props} loader={props.loader ?? (isSanity ? sanityLoader : undefined)} />;
}
