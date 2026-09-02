import "server-only";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

// FLM-33 — server-only Cashfree client. Raw fetch() against the REST API
// rather than the `cashfree-pg` npm SDK, matching this codebase's existing
// zero-HTTP-client-dependency style (no axios anywhere) — the REST surface
// used here is small (create order, get order status) and stable, and the
// one place a library would help (webhook signature verification) is a
// ~10-line HMAC check, no more complex than what lib/admin-session.ts
// already hand-rolls for session cookies.

type CashfreeMode = "sandbox" | "production";

function getMode(): CashfreeMode {
  return process.env.CASHFREE_MODE === "production" ? "production" : "sandbox";
}

function getBaseUrl(): string {
  return getMode() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function getHeaders(): Record<string, string> {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const apiVersion = process.env.CASHFREE_API_VERSION;
  if (!appId || !secretKey || !apiVersion) {
    throw new Error("Cashfree env vars (CASHFREE_APP_ID/SECRET_KEY/API_VERSION) are not set");
  }
  return {
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "x-api-version": apiVersion,
    "Content-Type": "application/json",
  };
}

interface CreateOrderInput {
  orderId: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

type CreateOrderResult =
  | { ok: true; paymentSessionId: string; cashfreeMode: CashfreeMode }
  | { ok: false; error: string };

// Reuses our own orders.id as Cashfree's order_id — no mapping table needed,
// the webhook payload's order_id IS our primary key.
export async function createCashfreeOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) return { ok: false, error: "SITE_URL is not set" };

  try {
    const res = await fetch(`${getBaseUrl()}/orders`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        order_id: input.orderId,
        order_amount: input.amount,
        order_currency: "INR",
        customer_details: {
          // Guest checkout has no real customer id — reuse the order id.
          customer_id: input.orderId,
          customer_phone: input.customerPhone,
          customer_email: input.customerEmail || "guest@studio242.co",
          customer_name: input.customerName,
        },
        order_meta: {
          // {order_id} is Cashfree's own template token, substituted by
          // Cashfree — not our string interpolation.
          return_url: `${siteUrl}/checkout/return?order_id={order_id}`,
          notify_url: `${siteUrl}/api/webhooks/cashfree`,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.payment_session_id) {
      console.error("createCashfreeOrder: Cashfree API error:", res.status, data);
      return { ok: false, error: "cashfree-create-order-failed" };
    }

    return { ok: true, paymentSessionId: data.payment_session_id, cashfreeMode: getMode() };
  } catch (e) {
    console.error("createCashfreeOrder: network/unexpected error:", e);
    return { ok: false, error: "unknown" };
  }
}

type OrderStatusResult =
  | { ok: true; orderStatus: string; paymentId: string | null }
  | { ok: false; error: string };

export async function getCashfreeOrderStatus(orderId: string): Promise<OrderStatusResult> {
  try {
    const res = await fetch(`${getBaseUrl()}/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("getCashfreeOrderStatus: Cashfree API error:", res.status, data);
      return { ok: false, error: "cashfree-status-failed" };
    }
    return {
      ok: true,
      orderStatus: data.order_status,
      paymentId: data.cf_order_id ? String(data.cf_order_id) : null,
    };
  } catch (e) {
    console.error("getCashfreeOrderStatus: network/unexpected error:", e);
    return { ok: false, error: "unknown" };
  }
}

// Signature is computed over the RAW request body (not re-serialized JSON —
// re-serialization can reorder keys/change whitespace and silently break
// every check) concatenated after the timestamp header. Node's `crypto`,
// not Web Crypto — this route only ever runs on the Node runtime, unlike
// proxy.ts which historically needed Edge compatibility.
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET;
  if (!secret || !timestamp || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false; // timingSafeEqual throws on mismatch
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

// Idempotent — the `status = 'pending_payment'` guard means whichever of
// the webhook or the /checkout/return page calls this first "wins"; the
// second caller's update matches zero rows and is a harmless no-op. Same
// fresh-condition-then-write idiom already used for the stock decrement in
// app/(site)/checkout/actions.ts.
export async function markOrderPaid(
  orderId: string,
  paymentId: string
): Promise<{ ok: boolean }> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid", payment_id: paymentId })
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .select("id");

  if (error) {
    console.error("markOrderPaid: update failed:", error.message);
    return { ok: false };
  }

  if (!data || data.length === 0) {
    console.log(`markOrderPaid: order ${orderId} already paid (or missing) — no-op`);
  }

  return { ok: true };
}
