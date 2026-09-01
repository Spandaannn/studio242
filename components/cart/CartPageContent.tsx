"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

// FLM-31 — the cart only exists in the browser (see CartProvider), so this
// whole page is a client island; there's nothing for the server to render.
export default function CartPageContent() {
  const { items, hydrated, removeItem, setQty, subtotal } = useCart();

  // Wait for localStorage to load before deciding what to show — otherwise
  // a real, non-empty cart would flash the "empty" state for a tick first.
  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--text-subtle)]">Your cart is empty.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-md bg-neutral-200 px-6 py-3 text-sm text-neutral-900 transition-colors hover:bg-neutral-300"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-[var(--border)]">
        {items.map((item) => (
          <li key={item.variantId} className="flex gap-4 py-5">
            <div className="h-28 w-20 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-neutral-200">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.productName}
                  width={160}
                  height={224}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <Link
                  href={`/product/${item.productSlug}`}
                  className="text-sm tracking-wide hover:underline"
                >
                  {item.productName}
                </Link>
                <p className="mt-1 text-xs text-[var(--text-subtle)]">
                  {[item.size, item.color].filter(Boolean).join(" / ") || "—"}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty(item.variantId, item.qty - 1)}
                    className="h-7 w-7 rounded-md border border-[var(--text)]/25 text-sm hover:border-[var(--text)]/50"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(item.variantId, item.qty + 1)}
                    className="h-7 w-7 rounded-md border border-[var(--text)]/25 text-sm hover:border-[var(--text)]/50"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  className="text-xs text-[var(--text-subtle)] underline hover:text-[var(--text)]"
                >
                  Remove
                </button>
              </div>
            </div>

            <p className="w-20 shrink-0 text-right text-sm">
              ₹ {(item.price * item.qty).toLocaleString("en-IN")}
            </p>
          </li>
        ))}
      </ul>

      <div className="h-fit rounded-md border border-[var(--border)] p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-subtle)]">Subtotal</span>
          <span>₹ {subtotal.toLocaleString("en-IN")}</span>
        </div>
        <p className="mt-2 text-xs text-[var(--text-subtle)]">
          Shipping and the final total are calculated at checkout.
        </p>
        <Link
          href="/checkout"
          className="mt-5 block rounded-md bg-neutral-200 py-3.5 text-center text-sm tracking-wide text-neutral-900 transition-colors hover:bg-neutral-300"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
