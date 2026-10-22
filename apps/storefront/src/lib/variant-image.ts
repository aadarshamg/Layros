// The size buttons (AddToCartForm) and the gallery (ProductGallery) sit in
// different parts of the product page, so a picked size announces its photo
// with a window event rather than through shared state.
export const VARIANT_IMAGE_EVENT = "leyros:variant-image";

export function announceVariantImage(image: string | undefined) {
  window.dispatchEvent(new CustomEvent<string | undefined>(VARIANT_IMAGE_EVENT, { detail: image }));
}
