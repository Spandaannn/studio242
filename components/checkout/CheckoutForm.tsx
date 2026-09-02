"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { createOrder } from "@/app/(site)/checkout/actions";

const ERROR_MESSAGES: Record<string, string> = {
  "empty-cart": "Your cart is empty.",
  "missing-fields": "Please fill in your name, phone, and address.",
  "stock-changed":
    "One or more items in your cart are no longer available in the quantity you selected. Please review your cart.",
  "payment-init-failed":
    "Couldn't start online payment. Please try again, or choose Cash on Delivery.",
  unknown: "Something went wrong placing your order. Please try again.",
};

export default function CheckoutForm() {
  const { items, hydrated, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "cashfree">("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createOrder(
      items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
      { name, phone, email, address, note },
      paymentMethod
    );

    if (!result.ok) {
      setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.unknown);
      setSubmitting(false);
      return;
    }

    if (result.paymentMethod === "cod") {
      clearCart();
      router.push(`/order-confirmation/${result.orderId}`);
      return;
    }

    // Cashfree — the order already exists and stock is already reserved, so
    // the cart is cleared here too (the shopper is leaving this component
    // instance for Cashfree's hosted page, not staying on it). Loaded
    // dynamically so the SDK stays out of the bundle for the common COD path.
    clearCart();
    const { load } = await import("@cashfreepayments/cashfree-js");
    const cashfree = await load({ mode: result.cashfreeMode });
    if (!cashfree) {
      setError(ERROR_MESSAGES["payment-init-failed"]);
      setSubmitting(false);
      return;
    }
    cashfree.checkout({
      paymentSessionId: result.paymentSessionId,
      redirectTarget: "_self",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 md:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div>
          <label htmlFor="name" className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-subtle)]">
            Full name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-subtle)]">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-subtle)]">
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-subtle)]">
            Delivery address
          </label>
          <textarea
            id="address"
            required
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House/flat, street, city, state, PIN code"
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label htmlFor="note" className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-subtle)]">
            Order note (optional)
          </label>
          <textarea
            id="note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-[var(--text-subtle)]">Payment</p>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-[var(--border)] px-3 py-2.5 text-sm">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              Cash on Delivery — pay when your order arrives
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-[var(--border)] px-3 py-2.5 text-sm">
              <input
                type="radio"
                name="paymentMethod"
                value="cashfree"
                checked={paymentMethod === "cashfree"}
                onChange={() => setPaymentMethod("cashfree")}
              />
              Pay online — card, UPI, and more
            </label>
          </div>
        </div>
      </div>

      <div className="h-fit rounded-md border border-[var(--border)] p-6">
        <div className="mb-4 space-y-2">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex justify-between gap-2 text-xs text-[var(--text-subtle)]"
            >
              <span className="flex-1">
                {item.productName} × {item.qty}
              </span>
              <span className="shrink-0">
                ₹ {(item.price * item.qty).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-sm">
          <span className="text-[var(--text-subtle)]">Subtotal</span>
          <span>₹ {subtotal.toLocaleString("en-IN")}</span>
        </div>
        <p className="mt-2 text-xs text-[var(--text-subtle)]">
          Final total is confirmed on your order.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-md bg-[var(--accent-1)] py-3.5 text-sm tracking-wide text-[var(--button-label)] transition-colors hover:bg-[var(--accent-2)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? paymentMethod === "cashfree"
              ? "Redirecting to payment…"
              : "Placing order…"
            : paymentMethod === "cashfree"
              ? "Pay now"
              : "Place order"}
        </button>
      </div>
    </form>
  );
}
