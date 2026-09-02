"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createCashfreeOrder } from "@/lib/cashfree";

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

// FLM-33 — tagged union on paymentMethod so the client can branch with a
// type guard instead of checking for an optional field.
export type CheckoutResult =
  | { ok: true; orderId: string; paymentMethod: "cod" }
  | {
      ok: true;
      orderId: string;
      paymentMethod: "cashfree";
      paymentSessionId: string;
      cashfreeMode: "sandbox" | "production";
    }
  | {
      ok: false;
      error: "empty-cart" | "missing-fields" | "stock-changed" | "payment-init-failed" | "unknown";
    };

interface FreshVariant {
  id: string;
  price: number;
  stock: number;
  product_id: string;
  products: { slug: string; status: string } | null;
}

export async function createOrder(
  items: CheckoutItemInput[],
  customer: CheckoutCustomerInput,
  paymentMethod: "cod" | "cashfree"
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
      payment_method: paymentMethod,
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
    return { ok: false, error: "unknown" };
  }

  // Decrement stock — conditional on a FRESH read right before the write
  // (not the value read during validation above), so a concurrent checkout
  // for the same variant can't push stock negative. Best-effort: a failure
  // here doesn't roll back the order, matching the non-atomic-writes
  // tradeoff already accepted elsewhere (see plan notes). Shared by both
  // payment methods — a Cashfree order reserves stock the moment it's
  // created, same as COD, regardless of whether payment ever completes.
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

  if (paymentMethod === "cod") {
    return { ok: true, orderId: order.id, paymentMethod: "cod" };
  }

  // Cashfree branch — the order + order_items + stock decrement above are
  // already committed, identical to COD. Only the payment-session step is
  // specific to this branch.
  const cashfreeResult = await createCashfreeOrder({
    orderId: order.id,
    amount: total,
    customerName: name,
    customerPhone: phone,
    customerEmail: customer.email.trim(),
  });

  if (!cashfreeResult.ok) {
    await cancelOrderAndRestoreStock(order.id, items, byId, slugsToRevalidate);
    return { ok: false, error: "payment-init-failed" };
  }

  return {
    ok: true,
    orderId: order.id,
    paymentMethod: "cashfree",
    paymentSessionId: cashfreeResult.paymentSessionId,
    cashfreeMode: cashfreeResult.cashfreeMode,
  };
}

// Compensating action when Cashfree order-creation fails after our order
// already exists: cancel the order (reusing the existing status value —
// functionally the same as a merchant manually cancelling) and reverse the
// stock decrement, same fresh-read-then-conditional-update pattern as the
// decrement itself. The row is kept, not deleted, so there's always
// something to attach the failure to and look up by id.
async function cancelOrderAndRestoreStock(
  orderId: string,
  items: CheckoutItemInput[],
  byId: Map<string, FreshVariant>,
  slugsToRevalidate: Set<string>
): Promise<void> {
  const { error: cancelError } = await supabaseAdmin
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);
  if (cancelError) {
    console.error(`cancelOrderAndRestoreStock: failed to cancel order ${orderId}:`, cancelError.message);
  }

  for (const item of items) {
    const { data: current } = await supabaseAdmin
      .from("variants")
      .select("stock")
      .eq("id", item.variantId)
      .single();
    const currentStock = current?.stock ?? 0;

    const { error: restoreError } = await supabaseAdmin
      .from("variants")
      .update({ stock: currentStock + item.qty })
      .eq("id", item.variantId)
      .eq("stock", currentStock);
    if (restoreError) {
      console.error(
        `cancelOrderAndRestoreStock: stock restore failed for variant ${item.variantId}:`,
        restoreError.message
      );
    }
  }

  for (const slug of slugsToRevalidate) {
    revalidatePath(`/product/${slug}`);
  }
}
