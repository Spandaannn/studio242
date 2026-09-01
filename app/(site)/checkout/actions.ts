"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

// FLM-32 — unlike the admin panel's <form action={fn}> + FormData convention,
// this is called directly as a function with a plain object from
// components/checkout/CheckoutForm.tsx (a deliberate deviation — the cart is
// array-shaped client state, not something a native <form> submit captures).
// It also doesn't call redirect() itself: the client needs to clear the
// cart (localStorage, unreachable from the server) before navigating away,
// so it gets a plain result back and decides what to do next.

export interface CheckoutItemInput {
  variantId: string;
  qty: number;
}

export interface CheckoutCustomerInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
}

export type CheckoutResult =
  | { ok: true; orderId: string }
  | { ok: false; error: "empty-cart" | "missing-fields" | "stock-changed" | "unknown" };

interface FreshVariant {
  id: string;
  price: number;
  stock: number;
  product_id: string;
  products: { slug: string; status: string } | null;
}

export async function createOrder(
  items: CheckoutItemInput[],
  customer: CheckoutCustomerInput
): Promise<CheckoutResult> {
  if (items.length === 0) {
    return { ok: false, error: "empty-cart" };
  }

  const name = customer.name.trim();
  const phone = customer.phone.trim();
  const address = customer.address.trim();
  if (!name || !phone || !address) {
    return { ok: false, error: "missing-fields" };
  }

  // Never trust the client's cart prices/names — re-look-up everything the
  // order actually needs from the database right now.
  const variantIds = items.map((i) => i.variantId);
  const { data: rawVariants, error: fetchError } = await supabaseAdmin
    .from("variants")
    .select("id, price, stock, product_id, products(slug, status)")
    .in("id", variantIds);

  if (fetchError) {
    console.error("createOrder: failed to re-fetch variants:", fetchError.message);
    return { ok: false, error: "unknown" };
  }

  const variants = (rawVariants ?? []) as unknown as FreshVariant[];
  const byId = new Map(variants.map((v) => [v.id, v]));

  // Any line that's gone, whose product is inactive, or that's short on
  // stock rejects the WHOLE checkout — no partial orders.
  for (const item of items) {
    const v = byId.get(item.variantId);
    if (!v || v.products?.status !== "active" || v.stock < item.qty) {
      return { ok: false, error: "stock-changed" };
    }
  }

  const total = items.reduce((sum, item) => sum + byId.get(item.variantId)!.price * item.qty, 0);

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_name: name,
      phone,
      email: customer.email.trim() || null,
      address,
      note: customer.note.trim() || null,
      total,
      status: "pending_payment",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("createOrder: failed to insert order:", orderError?.message);
    return { ok: false, error: "unknown" };
  }

  const orderItems = items.map((item) => ({
    order_id: order.id,
    variant_id: item.variantId,
    qty: item.qty,
    price_at_purchase: byId.get(item.variantId)!.price,
  }));
  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);
  if (itemsError) {
    console.error("createOrder: failed to insert order_items:", itemsError.message);
    // The order row exists but has no line items — a rare failure between
    // two inserts with no real transaction available (same accepted
    // limitation as the admin panel's syncVariants). Surfacing "unknown"
    // rather than pretending it succeeded.
    return { ok: false, error: "unknown" };
  }

  // Decrement stock — conditional on a FRESH read right before the write
  // (not the value read during validation above), so a concurrent checkout
  // for the same variant can't push stock negative. Best-effort: a failure
  // here doesn't roll back the order, matching the non-atomic-writes
  // tradeoff already accepted elsewhere (see plan notes).
  const slugsToRevalidate = new Set<string>();
  for (const item of items) {
    const slug = byId.get(item.variantId)!.products?.slug;
    if (slug) slugsToRevalidate.add(slug);

    const { data: current } = await supabaseAdmin
      .from("variants")
      .select("stock")
      .eq("id", item.variantId)
      .single();
    const currentStock = current?.stock ?? 0;

    if (currentStock < item.qty) {
      console.error(
        `createOrder: variant ${item.variantId} short on stock at decrement time (order ${order.id} already created) — not decrementing`
      );
      continue;
    }

    const { error: decrementError } = await supabaseAdmin
      .from("variants")
      .update({ stock: currentStock - item.qty })
      .eq("id", item.variantId)
      .eq("stock", currentStock);
    if (decrementError) {
      console.error(
        `createOrder: stock decrement failed for variant ${item.variantId}:`,
        decrementError.message
      );
    }
  }

  for (const slug of slugsToRevalidate) {
    revalidatePath(`/product/${slug}`);
  }

  return { ok: true, orderId: order.id };
}
