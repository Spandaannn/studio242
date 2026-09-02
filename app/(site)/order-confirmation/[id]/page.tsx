import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Looked up via supabaseAdmin, not the anon client — orders have zero RLS
// read access for any role (see FLM-25 in supabase/schema.sql), same as
// every other order-touching read in this app.
interface OrderDetail {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  note: string | null;
  total: number;
  status: string;
  payment_method: "cod" | "cashfree";
  created_at: string;
  order_items: {
    id: string;
    qty: number;
    price_at_purchase: number;
    variants: { size: string | null; color: string | null; products: { name: string; slug: string } | null } | null;
  }[];
}

// pending_payment reads differently depending on how the order was placed:
// COD, it's the whole point ("pay on delivery"). Cashfree, it means payment
// didn't complete — should be rare/transient given /checkout/return
// actively verifies before landing here, but reachable if the webhook is
// delayed, or the shopper abandoned payment entirely.
function statusMessage(status: string, paymentMethod: "cod" | "cashfree"): string {
  if (status === "pending_payment") {
    return paymentMethod === "cashfree"
      ? "Payment not completed yet. If you completed payment and still see this, please refresh in a moment."
      : "Cash on Delivery — pay when your order arrives.";
  }
  const MESSAGE: Record<string, string> = {
    paid: "Payment received — thank you!",
    packed: "Your order is packed and ready to ship.",
    shipped: "Your order is on its way.",
    delivered: "Your order has been delivered.",
    cancelled: "This order was cancelled.",
  };
  return MESSAGE[status] ?? status;
}

export default async function OrderConfirmationPage(
  props: PageProps<"/order-confirmation/[id]">
) {
  const { id } = await props.params;

  const { data: rawOrder, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, customer_name, phone, email, address, note, total, status, payment_method, created_at, order_items(id, qty, price_at_purchase, variants(size, color, products(name, slug)))"
    )
    .eq("id", id)
    .single();

  if (error || !rawOrder) {
    notFound();
  }

  const order = rawOrder as unknown as OrderDetail;

  return (
    <div className="flex-1 bg-[var(--bg-1)]">
      <div className="mx-auto max-w-2xl px-6 py-14 sm:px-12">
        <h1 className="text-[28px] font-light tracking-wide">Thank you, {order.customer_name}!</h1>
        <p className="mt-2 text-sm text-[var(--text-subtle)]">
          Order placed {new Date(order.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className="mt-4 rounded-md border border-[var(--border)] px-4 py-3 text-sm">
          {statusMessage(order.status, order.payment_method)}
        </p>

        <div className="mt-8 divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p>{item.variants?.products?.name ?? "Product"}</p>
                <p className="text-xs text-[var(--text-subtle)]">
                  {[item.variants?.size, item.variants?.color].filter(Boolean).join(" / ") || "—"}
                  {" · "}Qty {item.qty}
                </p>
              </div>
              <p className="shrink-0">
                ₹ {(item.price_at_purchase * item.qty).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 text-sm font-medium">
            <span>Total</span>
            <span>₹ {order.total.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="mt-8 text-sm text-[var(--text-subtle)]">
          <p className="mb-1 text-[var(--text)]">Delivering to</p>
          <p>{order.address}</p>
          <p className="mt-1">{order.phone}</p>
          {order.email && <p>{order.email}</p>}
        </div>

        <Link
          href="/"
          className="mt-10 inline-block rounded-md bg-neutral-200 px-6 py-3 text-sm text-neutral-900 transition-colors hover:bg-neutral-300"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
