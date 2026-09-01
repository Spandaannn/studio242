"use client";

import { useCart } from "@/components/cart/CartProvider";

// Sits inside Header's bag-icon link. Renders nothing until the cart has
// hydrated from localStorage (see CartProvider) — otherwise every page load
// would flash "0" for a tick before the real count appears.
export default function CartCountBadge() {
  const { count, hydrated } = useCart();

  if (!hydrated || count === 0) return null;

  return (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--accent-1)] px-1 text-[10px] font-medium text-[var(--button-label)]">
      {count}
    </span>
  );
}
