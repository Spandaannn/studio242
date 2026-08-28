import { supabase } from "@/lib/supabase";

export interface CategoryTile {
  name: string;
  slug: string;
  image: string | null;
}

// A homepage collage tile needs one representative photo per category.
// Prefer the curated image_url (matches studio242.co's real collection
// photos) — fall back to the newest active product's cover image only
// for categories that haven't had a hero image set yet.
export async function getCategoryTile(slug: string): Promise<CategoryTile | null> {
  const { data: category } = await supabase
    .from("categories")
    .select("name, slug, id, image_url")
    .eq("slug", slug)
    .single();

  if (!category) return null;

  if (category.image_url) {
    return { name: category.name, slug: category.slug, image: category.image_url };
  }

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
