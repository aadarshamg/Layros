"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartLine {
  /** Unique per cart line, keyed by variant — adding the same variant again stacks quantity onto this line. */
  id: string;
  productId: string;
  handle: string;
  variantId: string;
  title: string;
  image?: string;
  sizeMl: number;
  sizeLabel?: string;
  sku: string;
  unitPrice: number;
  /** Struck-through original price, when the variant is on sale — carried through for cart/drawer display. */
  compareAtPrice?: number;
  quantity: number;
}

export interface AddCartLineInput {
  productId: string;
  handle: string;
  variantId: string;
  title: string;
  image?: string;
  sizeMl: number;
  sizeLabel?: string;
  sku: string;
  unitPrice: number;
  compareAtPrice?: number;
  quantity: number;
}

export interface AppliedCoupon {
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  minOrderAmount?: number;
}

interface CartContextValue {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  /** Sum of each line's compareAtPrice (falling back to unitPrice where unset) × quantity — the "before discounts" MRP total. */
  compareAtSubtotal: number;
  /** compareAtSubtotal - subtotal — what the catalog's own MRP markdowns already saved, before any coupon. */
  mrpSavings: number;
  appliedCoupon: AppliedCoupon | null;
  /** Coupon discount recomputed live from the current subtotal — stays correct as items are added/removed, never a stale frozen number. */
  couponDiscount: number;
  /** subtotal - couponDiscount — what checkout actually charges. */
  total: number;
  couponError: string | null;
  isApplyingCoupon: boolean;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  /** True right after a coupon is successfully applied — drives a brief celebration overlay, then dismiss. */
  showCouponCelebration: boolean;
  dismissCouponCelebration: () => void;
  /** True once the cart has hydrated from localStorage — use to avoid flashing an empty cart on first render. */
  isReady: boolean;
  addItem: (input: AddCartLineInput) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
  /** The slide-out cart drawer — this is the primary way customers see their cart, not a /cart page visit. */
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CART_STORAGE_KEY = "leyros_cart";
const STORAGE_KEY = CART_STORAGE_KEY;
const COUPON_STORAGE_KEY = "leyros_coupon";

function calculateCouponDiscount(coupon: AppliedCoupon, subtotal: number): number {
  const raw = coupon.discountType === "percent" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
  return Math.min(Math.round(raw), subtotal);
}

// Same variant is the same line — quantity stacks rather than creating a duplicate row.
function lineKey(input: Pick<AddCartLineInput, "variantId">) {
  return input.variantId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showCouponCelebration, setShowCouponCelebration] = useState(false);

  // Hydrate from localStorage after mount only — localStorage doesn't exist
  // during server rendering, and reading it during render would desync the
  // server-rendered HTML from the client's first paint (hydration error).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
      const rawCoupon = window.localStorage.getItem(COUPON_STORAGE_KEY);
      if (rawCoupon) setAppliedCoupon(JSON.parse(rawCoupon));
    } catch {
      // Corrupt or inaccessible storage (private browsing, quota) — start with an empty cart.
    } finally {
      setIsReady(true);
    }
    // Links like WhatsApp cart reminders land on "/?cart=open" to show the bag straight away.
    const url = new URL(window.location.href);
    if (url.searchParams.get("cart") === "open") {
      setIsDrawerOpen(true);
      url.searchParams.delete("cart");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked — the cart still works for this tab, it just won't persist.
    }
  }, [items, isReady]);

  useEffect(() => {
    if (!isReady) return;
    try {
      if (appliedCoupon) window.localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      else window.localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {
      // Storage full or blocked — the coupon still works for this tab, it just won't persist.
    }
  }, [appliedCoupon, isReady]);

  const addItem = useCallback((input: AddCartLineInput) => {
    setItems((current) => {
      const key = lineKey(input);
      const existing = current.find((line) => lineKey(line) === key);
      if (existing) {
        return current.map((line) =>
          line.id === existing.id ? { ...line, quantity: line.quantity + input.quantity } : line,
        );
      }
      const newLine: CartLine = { ...input, id: `${key}::${Date.now()}` };
      return [...current, newLine];
    });
    // Adding an item is the moment the drawer earns its keep — show what
    // just happened instead of leaving the customer to guess.
    setIsDrawerOpen(true);
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) return current.filter((line) => line.id !== lineId);
      return current.map((line) => (line.id === lineId ? { ...line, quantity } : line));
    });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((current) => current.filter((line) => line.id !== lineId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponError(null);
  }, []);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError(null);
  }, []);
  const dismissCouponCelebration = useCallback(() => setShowCouponCelebration(false), []);

  const itemCount = useMemo(() => items.reduce((sum, line) => sum + line.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0), [items]);
  const compareAtSubtotal = useMemo(
    () => items.reduce((sum, line) => sum + (line.compareAtPrice ?? line.unitPrice) * line.quantity, 0),
    [items],
  );
  const mrpSavings = Math.max(0, compareAtSubtotal - subtotal);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.minOrderAmount && subtotal < appliedCoupon.minOrderAmount) return 0;
    return calculateCouponDiscount(appliedCoupon, subtotal);
  }, [appliedCoupon, subtotal]);
  const total = Math.max(0, subtotal - couponDiscount);

  const applyCoupon = useCallback(
    async (code: string) => {
      setIsApplyingCoupon(true);
      setCouponError(null);
      try {
        const response = await fetch("/api/checkout/apply-coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, subtotal }),
        });
        const data = await response.json();
        if (!data.valid || !data.coupon) {
          setCouponError(data.message ?? "That coupon code isn't valid.");
          return;
        }
        setAppliedCoupon(data.coupon);
        setShowCouponCelebration(true);
      } catch {
        setCouponError("Could not apply that code. Please try again.");
      } finally {
        setIsApplyingCoupon(false);
      }
    },
    [subtotal],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      compareAtSubtotal,
      mrpSavings,
      appliedCoupon,
      couponDiscount,
      total,
      couponError,
      isApplyingCoupon,
      applyCoupon,
      removeCoupon,
      showCouponCelebration,
      dismissCouponCelebration,
      isReady,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [
      items,
      itemCount,
      subtotal,
      compareAtSubtotal,
      mrpSavings,
      appliedCoupon,
      couponDiscount,
      total,
      couponError,
      isApplyingCoupon,
      applyCoupon,
      removeCoupon,
      showCouponCelebration,
      dismissCouponCelebration,
      isReady,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
