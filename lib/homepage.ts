import { supabase } from "@/lib/supabase";

export interface CategoryTile {
  name: string;
  slug: string;
  image: string | null;
}

// A homepage collage tile needs one representative photo per category.
// categories has no image column of its own, so we borrow the newest
// active product's cover image — zero schema changes, good enough until
// there's an admin UI to pick a real hero image per category.
export async function getCategoryTile(slug: string): Promise<CategoryTile | null> {
  const { data: category } = await supabase
    .from("categories")
    .select("name, slug, id")
    .eq("slug", slug)
    .single();

  if (!category) return null;

  const { data: product } = await supabase
    .from("products")
    .select("product_images(url, sort_order)")
    .eq("category_id", category.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const images = (product as unknown as { product_images: { url: string; sort_order: number }[] } | null)
    ?.product_images;
  const cover = images?.length
    ? [...images].sort((a, b) => a.sort_order - b.sort_order)[0]
    : null;

  return { name: category.name, slug: category.slug, image: cover?.url ?? null };
}
