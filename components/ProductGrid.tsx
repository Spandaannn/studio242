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
  created_at: string;
  product_images: { url: string; sort_order: number }[];
  variants: { price: number; stock: number }[];
}

// FLM-frontend-fixes — the six sort modes a shopper can pick on a category
// page. Kept as a literal union (not a DB enum) since this only ever governs
// an in-memory sort, never a query.
type SortOption =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

interface ProductGridProps {
  categoryId?: string;
  // Optional and only ever passed by category pages — the homepage's
  // <ProductGrid /> call passes none, so it keeps rendering in the
  // original "newest first" order with no sort control anywhere near it.
  sort?: string;
}

export default async function ProductGrid({ categoryId, sort }: ProductGridProps) {
  let query = supabase
    .from("products")
    .select("id, name, slug, created_at, product_images(url, sort_order), variants(price, stock)")
    .eq("status", "active");

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

  // fromPrice computed once here (rather than inline in the JSX map below)
  // since price sorting needs it too — variants.price lives on the embedded
  // variants table, not products, so there's no products.price column a
  // database-level .order() could sort by. With the dataset per category
  // being small (boutique store), sorting the already-fetched array in JS
  // is simpler than a Postgres view/RPC, and keeps every sort mode —
  // date, price, name — going through one comparator instead of splitting
  // "some sorts are DB-level, some are JS-level."
  const withFromPrice = products.map((product) => ({
    ...product,
    fromPrice: product.variants.length
      ? Math.min(...product.variants.map((v) => v.price))
      : null,
  }));

  const SORT_OPTIONS: readonly string[] = [
    "newest",
    "oldest",
    "price-asc",
    "price-desc",
    "name-asc",
    "name-desc",
  ];
  const sortMode: SortOption = SORT_OPTIONS.includes(sort ?? "")
    ? (sort as SortOption)
    : "newest";

  const sorted = [...withFromPrice].sort((a, b) => {
    switch (sortMode) {
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "price-asc":
        return (a.fromPrice ?? Infinity) - (b.fromPrice ?? Infinity);
      case "price-desc":
        return (b.fromPrice ?? -Infinity) - (a.fromPrice ?? -Infinity);
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "newest":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-5 gap-y-10 px-6 py-10 sm:grid-cols-3 sm:px-12">
      {sorted.map((product) => {
        const cover = [...product.product_images].sort(
          (a, b) => a.sort_order - b.sort_order
        )[0];
        // Only fully sold-out products get the tag — a product with some
        // variants still in stock never shows it, per the "stay visible,
        // never hidden" decision this is meant to complement, not replace.
        const soldOut =
          product.variants.length === 0 || product.variants.every((v) => v.stock === 0);

        return (
          <Link key={product.id} href={`/product/${product.slug}`} className="group">
            <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-[var(--border)] bg-neutral-200">
              {soldOut && (
                <span className="absolute left-2 top-2 z-10 rounded-full bg-[var(--accent-1)] px-2.5 py-1 text-[11px] tracking-wide text-[var(--button-label)]">
                  Sold Out
                </span>
              )}
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
            {product.fromPrice !== null && (
              <p className="text-sm text-[var(--text-muted)]">
                ₹ {product.fromPrice.toLocaleString("en-IN")}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
