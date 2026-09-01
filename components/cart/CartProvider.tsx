"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// FLM-30 — the cart lives in the browser only (no accounts, no server-side
// cart table by design — see plan). variantId is the unique key: adding an
// already-present variant just bumps qty. `price` here is DISPLAY-ONLY —
// checkout re-looks-up real prices server-side and never trusts this value.
export interface CartItem {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  size: string | null;
  color: string | null;
  image: string | null;
  price: number;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clearCart: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "studio242_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  // Server-rendered HTML always has an empty cart (localStorage doesn't
  // exist on the server) — loading happens in an effect, one tick after
  // mount, so the client's first render matches the server's and React
  // doesn't complain about a hydration mismatch. `hydrated` lets consumers
  // (the header badge) know not to render a count until the real value —
  // possibly non-zero — has loaded, avoiding a flash of "0".
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // One-time bootstrap read of an external store (localStorage) on
      // mount — this has to run in an effect rather than a lazy useState
      // initializer specifically so the client's first render still matches
      // the server's empty-cart HTML, avoiding a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupt JSON or storage blocked entirely — just start empty.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Skip the very first run (before the load above has happened) — saving
    // here would overwrite a real saved cart with the empty initial state.
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked — the cart just won't persist this change.
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.variantId !== variantId)
        : prev.map((i) => (i.variantId === variantId ? { ...i, qty } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);

  const value = useMemo(
    () => ({ items, hydrated, addItem, removeItem, setQty, clearCart, count, subtotal }),
    [items, hydrated, addItem, removeItem, setQty, clearCart, count, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
