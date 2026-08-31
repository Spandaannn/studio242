import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductImages } from "@/components/admin/ProductImages";
import { updateProduct } from "@/app/(admin)/admin/(dashboard)/products/actions";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface ProductWithVariants {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "active" | "inactive";
  category_id: string | null;
  variants: { id: string; size: string | null; color: string | null; price: number; stock: number }[];
  product_images: { id: string; url: string; sort_order: number }[];
}

export default async function EditProductPage(props: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : undefined;

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select(
        "id, name, slug, description, status, category_id, variants(id, size, color, price, stock), product_images(id, url, sort_order)"
      )
      .eq("id", id)
      .single(),
    supabaseAdmin.from("categories").select("id, name").order("sort_order", { ascending: true }),
  ]);

  if (!product) {
    notFound();
  }

  const typedProduct = product as unknown as ProductWithVariants;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Edit {typedProduct.name}</h1>
      <ProductForm
        action={updateProduct.bind(null, typedProduct.id)}
        categories={categories ?? []}
        defaultValues={typedProduct}
        variants={typedProduct.variants}
        error={error}
      />
      <div className="mt-8 max-w-2xl border-t border-neutral-200 pt-6">
        <ProductImages productId={typedProduct.id} images={typedProduct.product_images} />
      </div>
    </div>
  );
}
