import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  packed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-neutral-200 text-neutral-700",
  cancelled: "bg-red-100 text-red-700",
};

// order_items(count) is a PostgREST aggregate — comes back as
// order_items: [{ count: N }], not the actual rows.
interface OrderRow {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  order_items: { count: number }[];
}

export default async function AdminOrdersPage() {
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, customer_name, total, status, created_at, order_items(count)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("AdminOrdersPage: failed to load orders:", error.message);
  }

  const rows = (orders ?? []) as unknown as OrderRow[];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Orders</h1>

      <div className="overflow-hidden rounded-md border border-neutral-300 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-300 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Items</th>
              <th className="px-4 py-2.5">Total</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr key={order.id} className="border-b border-neutral-200 last:border-0">
                <td className="px-4 py-2.5">{order.customer_name}</td>
                <td className="px-4 py-2.5 text-neutral-500">{order.order_items[0]?.count ?? 0}</td>
                <td className="px-4 py-2.5">₹ {order.total.toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      STATUS_STYLES[order.status] ?? "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-neutral-500">
                  {new Date(order.created_at).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-neutral-600 hover:text-neutral-900"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
