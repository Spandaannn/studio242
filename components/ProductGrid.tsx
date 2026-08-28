import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

// The hand-written Database type in lib/supabase.ts doesn't encode table
// relationships, so a nested select like this comes back untyped from
// supabase-js. Shape it explicitly here rather than fighting the generic.
interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  product_images: { url: string; sort_order: number }[];
  variants: { price: number }[];
}

interface ProductGridProps {
  categoryId?: string;
}

export default async function ProductGrid({ categoryId }: ProductGridProps) {
  let query = supabase
    .from("products")
    .select("id, name, slug, product_images(url, sort_order), variants(price)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("ProductGrid: failed to load products:", error.message);
  }

  const products = (data ?? []) as unknown as ProductCardData[];

  if (products.length === 0) {
    return (
      <p className="mx-auto max-w-5xl px-6 py-20 text-center text-[var(--text-subtle)]">
        No products yet — check back soon.
      </p>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-5 gap-y-10 px-6 py-10 sm:grid-cols-3 sm:px-12">
      {products.map((product) => {
        const cover = [...product.product_images].sort(
          (a, b) => a.sort_order - b.sort_order
        )[0];
        const fromPrice = product.variants.length
          ? Math.min(...product.variants.map((v) => v.price))
          : null;

        return (
          <Link key={product.id} href={`/product/${product.slug}`} className="group">
            <div className="aspect-[3/4] overflow-hidden rounded-md border border-[var(--border)] bg-neutral-200">
              {cover && (
                <Image
                  src={cover.url}
                  alt={product.name}
                  width={400}
                  height={533}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              )}
            </div>
            <p className="mt-3 text-[15px] font-light">{product.name}</p>
            {fromPrice !== null && (
              <p className="text-sm text-[var(--text-muted)]">
                ₹ {fromPrice.toLocaleString("en-IN")}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
