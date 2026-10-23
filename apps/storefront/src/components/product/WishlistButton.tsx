"use client";

import { toggleWishlist, useWishlist } from "@/lib/wishlist";

export function WishlistButton({ productId, productName, className = "" }: { productId: string; productName: string; className?: string }) {
  const saved = useWishlist().includes(productId);
  return (
    <button
      type="button"
      className={`wishlist-button${saved ? " is-saved" : ""} ${className}`.trim()}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from your wishlist` : `Save ${productName} to your wishlist`}
      onClick={(event) => {
        // Cards wrap the photo in a link; saving shouldn't open the product.
        event.preventDefault();
        event.stopPropagation();
        toggleWishlist(productId);
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4Z" />
      </svg>
    </button>
  );
}
