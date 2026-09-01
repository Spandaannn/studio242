import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { updateOrderStatus } from "@/app/(admin)/admin/(dashboard)/orders/actions";

interface OrderDetail {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  note: string | null;
  total: number;
  status: string;
  created_at: string;
  order_items: {
    id: string;
    qty: number;
    price_at_purchase: number;
    variants: {
      size: string | null;
      color: string | null;
      products: { name: string } | null;
    } | null;
  }[];
}

const STATUSES = [
  "pending_payment",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export default async function AdminOrderDetailPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : undefined;

  const { data: rawOrder, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select(
      "id, customer_name, phone, email, address, note, total, status, created_at, order_items(id, qty, price_at_purchase, variants(size, color, products(name)))"
    )
    .eq("id", id)
    .single();

  if (fetchError || !rawOrder) {
    notFound();
  }

  const order = rawOrder as unknown as OrderDetail;

  return (
    <div className="max-w-2xl">
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Something went wrong updating the status.
        </p>
      )}

      <h1 className="mb-1 text-xl font-semibold">Order from {order.customer_name}</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Placed {new Date(order.created_at).toLocaleString("en-IN")}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-6 rounded-md border border-neutral-300 bg-white p-4 text-sm">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">Contact</p>
          <p>{order.phone}</p>
          {order.email && <p>{order.email}</p>}
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">Address</p>
          <p>{order.address}</p>
        </div>
        {order.note && (
          <div className="col-span-2">
            <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">Note</p>
            <p>{order.note}</p>
          </div>
        )}
      </div>

      <div className="mb-6 overflow-hidden rounded-md border border-neutral-300 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-300 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2.5">Product</th>
              <th className="px-4 py-2.5">Qty</th>
              <th className="px-4 py-2.5">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-200 last:border-0">
                <td className="px-4 py-2.5">
                  {item.variants?.products?.name ?? "—"}
                  <span className="ml-2 text-xs text-neutral-500">
                    {[item.variants?.size, item.variants?.color].filter(Boolean).join(" / ")}
                  </span>
                </td>
                <td className="px-4 py-2.5">{item.qty}</td>
                <td className="px-4 py-2.5">
                  ₹ {(item.price_at_purchase * item.qty).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end border-t border-neutral-300 px-4 py-2.5 text-sm font-medium">
          Total: ₹ {order.total.toLocaleString("en-IN")}
        </div>
      </div>

      <form action={updateOrderStatus.bind(null, order.id)} className="flex items-center gap-3">
        <label htmlFor="status" className="text-sm text-neutral-600">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={order.status}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Update
        </button>
      </form>
    </div>
  );
}
