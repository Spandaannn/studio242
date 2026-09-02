import { verifyCashfreeWebhookSignature, markOrderPaid } from "@/lib/cashfree";

// FLM-33 — the first Route Handler in this app (a webhook is a real HTTP
// call from Cashfree's servers, not something the browser triggers, so it
// can't be a Server Action). Runs alongside app/(site)/checkout/return/
// page.tsx as the two independent confirmations of payment — see
// lib/cashfree.ts's markOrderPaid for the idempotency guard shared by both.

// Cashfree sends several webhook event types per order attempt (success,
// failure, user-dropped, ...). Only the success type should ever flip an
// order to "paid" — everything else is logged and acknowledged, not acted
// on, so orders.status only moves forward on a confirmed success signal.
//
// NOTE: the exact field/value Cashfree uses to mark a successful payment
// event is flagged uncertain in the plan — confirm against a real sandbox
// webhook payload or the dashboard's sample payload before relying on this
// in production. Isolated to this one comparison so it's a one-line fix.
const PAYMENT_SUCCESS_EVENT = "PAYMENT_SUCCESS_WEBHOOK";

export async function POST(request: Request) {
  // Raw body FIRST, before any parsing — the signature is computed over the
  // exact bytes received, not a re-serialized JSON.stringify(JSON.parse(...))
  // which could reorder keys or change whitespace and silently break every
  // signature check.
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");

  if (!signature || !timestamp || !verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
    console.error("cashfree webhook: signature verification failed");
    return new Response("invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const event = payload as {
    type?: string;
    data?: { order?: { order_id?: string }; payment?: { cf_payment_id?: string | number } };
  };

  if (event.type !== PAYMENT_SUCCESS_EVENT) {
    // Failure/user-dropped/unrecognized — acknowledged so Cashfree doesn't
    // retry, but deliberately not acted on.
    console.log(`cashfree webhook: ignoring event type "${event.type}"`);
    return new Response("ok", { status: 200 });
  }

  const orderId = event.data?.order?.order_id;
  const paymentId = event.data?.payment?.cf_payment_id;
  if (!orderId || paymentId === undefined) {
    console.error("cashfree webhook: success event missing order_id/cf_payment_id", event);
    return new Response("ok", { status: 200 });
  }

  await markOrderPaid(orderId, String(paymentId));
  return new Response("ok", { status: 200 });
}
