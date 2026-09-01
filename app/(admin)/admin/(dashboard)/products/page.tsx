import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { deleteProduct } from "@/app/(admin)/admin/(dashboard)/products/actions";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

const ERROR_MESSAGES: Record<string, string> = {
  "has-orders": "That product can't be deleted because it has past orders — set it to Inactive instead.",
  unknown: "Something went wrong deleting that product.",
};

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : undefined;

  const { data: products, error: fetchError } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, status, categories(name)")
    .order("created_at", { ascending: false });

  if (fetchError) {
    console.error("AdminProductsPage: failed to load products:", fetchError.message);
  }

  const rows = (products ?? []) as unknown as {
    id: string;
    name: string;
    slug: string;
    status: string;
    categories: { name: string } | null;
  }[];

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unknown}
        </p>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-300"
        >
          + New Product
        </Link>
      </div>

      <div className="overflow-hidden rounded-md border border-neutral-300 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-300 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => (
              <tr key={product.id} className="border-b border-neutral-200 last:border-0">
                <td className="px-4 py-2.5">{product.name}</td>
                <td className="px-4 py-2.5 text-neutral-500">
                  {product.categories?.name ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      product.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-neutral-600 hover:text-neutral-900"
                    >
                      Edit
                    </Link>
                    <form action={deleteProduct.bind(null, product.id)}>
                      <ConfirmSubmitButton
                        confirmMessage={`Delete "${product.name}"? This can't be undone.`}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
