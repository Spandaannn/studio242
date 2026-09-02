import { redirect, notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCashfreeOrderStatus, markOrderPaid } from "@/lib/cashfree";

// FLM-33 — where Cashfree redirects the shopper back after hosted checkout
// (order_meta.return_url). This page renders nothing of its own — it's a
// pure verify-then-forward step, always ending in a redirect to the same
// order-confirmation page COD orders land on.
//
// NEVER treats "the shopper is on this URL" as proof of payment (forgeable
// — a shopper could hand-navigate here, or land here on a payment that
// later failed/reversed) — always independently re-checks with Cashfree
// before deciding anything, unless the webhook has already settled it.
export default async function CheckoutReturnPage(props: PageProps<"/checkout/return">) {
  const searchParams = await props.searchParams;
  const orderId = typeof searchParams.order_id === "string" ? searchParams.order_id : undefined;

  if (!orderId) {
    notFound();
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (!order) {
    notFound();
  }

  // Webhook may have already won the race — nothing left to verify.
  if (order.status !== "pending_payment") {
    redirect(`/order-confirmation/${orderId}`);
  }

  const statusResult = await getCashfreeOrderStatus(orderId);
  if (statusResult.ok && statusResult.orderStatus === "PAID") {
    await markOrderPaid(orderId, statusResult.paymentId ?? orderId);
  }

  redirect(`/order-confirmation/${orderId}`);
}
