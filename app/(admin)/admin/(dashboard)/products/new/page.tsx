import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/app/(admin)/admin/(dashboard)/products/actions";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function NewProductPage(props: PageProps<"/admin/products/new">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : undefined;

  const { data: categories } = await supabaseAdmin
    .from("categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">New Product</h1>
      <ProductForm action={createProduct} categories={categories ?? []} error={error} />
    </div>
  );
}
