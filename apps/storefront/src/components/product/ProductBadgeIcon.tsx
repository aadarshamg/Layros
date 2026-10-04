// Drawn arrow for the "Hot Selling" / "Best Seller" badges. The "↗" character
// rendered as a blue emoji tile on iPhones; this follows the badge text colour.
export function ProductBadgeIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: "none" }}
    >
      <path d="M2.5 9.5 9.5 2.5M4.5 2.5h5v5" />
    </svg>
  );
}
