"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { slugify } from "@/lib/slug";

interface VariantInput {
  id?: string;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
}

function readProductFields(formData: FormData): {
  name: string;
  slug: string;
  description: string | null;
  status: "active" | "inactive";
  categoryId: string | null;
} {
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(rawSlug || name);
  const description = String(formData.get("description") ?? "").trim() || null;
  const status = formData.get("status") === "active" ? "active" : "inactive";
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  return { name, slug, description, status, categoryId };
}

// Variant rows arrive as variants[0].size, variants[0].price, etc. — see
// components/admin/VariantsEditor.tsx for why this shape (uncontrolled
// inputs, no client-side value tracking needed).
function parseVariants(formData: FormData): VariantInput[] {
  const indices = new Set<number>();
  for (const key of formData.keys()) {
    const match = key.match(/^variants\[(\d+)\]\./);
    if (match) indices.add(Number(match[1]));
  }

  return [...indices]
    .sort((a, b) => a - b)
    .map((i) => {
      const id = formData.get(`variants[${i}].id`);
      const size = String(formData.get(`variants[${i}].size`) ?? "").trim();
      const color = String(formData.get(`variants[${i}].color`) ?? "").trim();
      const price = parseFloat(String(formData.get(`variants[${i}].price`) ?? ""));
      const stock = parseInt(String(formData.get(`variants[${i}].stock`) ?? ""), 10);
      return {
        id: id ? String(id) : undefined,
        size: size || null,
        color: color || null,
        // Never trust client numbers — mirror the DB's own check constraints.
        price: Math.max(0, Number.isFinite(price) ? price : 0),
        stock: Math.max(0, Number.isFinite(stock) ? stock : 0),
      };
    });
}

// Diffs submitted variants against what's already saved: no id -> insert,
// id present in both -> update, id existed but missing from submission ->
// delete (the row was removed in the browser). Inserts/updates run before
// deletes so a mid-save failure loses as little as possible — supabase-js
// can't wrap this in one real transaction (see plan notes).
async function syncVariants(productId: string, submitted: VariantInput[]) {
  const { data: existing } = await supabaseAdmin
    .from("variants")
    .select("id")
    .eq("product_id", productId);
  const existingIds = new Set((existing ?? []).map((v) => v.id));

  const toInsert = submitted
    .filter((v) => !v.id)
    .map((v) => ({
      product_id: productId,
      size: v.size,
      color: v.color,
      price: v.price,
      stock: v.stock,
    }));
  if (toInsert.length) {
    const { error } = await supabaseAdmin.from("variants").insert(toInsert);
    if (error) throw error;
  }

  const toUpdate = submitted.filter((v) => v.id && existingIds.has(v.id));
  for (const v of toUpdate) {
    const { error } = await supabaseAdmin
      .from("variants")
      .update({ size: v.size, color: v.color, price: v.price, stock: v.stock })
      .eq("id", v.id!);
    if (error) throw error;
  }

  const submittedIds = new Set(submitted.filter((v) => v.id).map((v) => v.id!));
  const toDelete = [...existingIds].filter((id) => !submittedIds.has(id));
  if (toDelete.length) {
    const { error } = await supabaseAdmin.from("variants").delete().in("id", toDelete);
    if (error) throw error;
  }
}

function revalidateStorefront(slug?: string) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/product/${slug}`);
}

export async function createProduct(formData: FormData) {
  await requireAdminSession();
  const { name, slug, description, status, categoryId } = readProductFields(formData);
  const variants = parseVariants(formData);

  if (!name || !slug) {
    redirect("/admin/products/new?error=missing-fields");
  }

  const { data: product, error } = await supabaseAdmin
    .from("products")
    .insert({ name, slug, description, status, category_id: categoryId })
    .select("id, slug")
    .single();

  if (error || !product) {
    redirect(`/admin/products/new?error=${error?.code === "23505" ? "slug-taken" : "unknown"}`);
  }

  if (variants.length) {
    try {
      await syncVariants(product.id, variants);
    } catch (e) {
      console.error("createProduct: variant insert failed:", e);
      redirect(`/admin/products/${product.id}/edit?error=variants`);
    }
  }

  revalidateStorefront(product.slug);
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdminSession();
  const { name, slug, description, status, categoryId } = readProductFields(formData);
  const variants = parseVariants(formData);

  if (!name || !slug) {
    redirect(`/admin/products/${id}/edit?error=missing-fields`);
  }

  const { data: oldProduct } = await supabaseAdmin
    .from("products")
    .select("slug")
    .eq("id", id)
    .single();

  const { error } = await supabaseAdmin
    .from("products")
    .update({ name, slug, description, status, category_id: categoryId })
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/products/${id}/edit?error=${error.code === "23505" ? "slug-taken" : "unknown"}`
    );
  }

  try {
    await syncVariants(id, variants);
  } catch (e) {
    console.error("updateProduct: variant sync failed:", e);
    redirect(`/admin/products/${id}/edit?error=variants`);
  }

  revalidateStorefront(oldProduct?.slug);
  revalidateStorefront(slug);
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireAdminSession();

  // Fetch image URLs before deleting — the products.id FK cascade removes
  // the product_images ROWS automatically, but not the underlying Storage
  // FILES. Those have to be cleaned up here, from what we know right now,
  // before the rows referencing them are gone.
  const { data: rawProduct } = await supabaseAdmin
    .from("products")
    .select("slug, product_images(url)")
    .eq("id", id)
    .single();
  const product = rawProduct as unknown as {
    slug: string;
    product_images: { url: string }[];
  } | null;

  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);

  if (error) {
    // 23503 = FK violation — order_items.variant_id has no ON DELETE clause
    // (NO ACTION by default), so a product that's ever been ordered can't
    // be deleted without orphaning order history. That's correct behavior;
    // the fix is marking it inactive instead, which already exists for this.
    if (error.code === "23503") {
      redirect("/admin/products?error=has-orders");
    }
    console.error("deleteProduct failed:", error.message);
    redirect("/admin/products?error=unknown");
  }

  // Best-effort, same as deleteImageAction: a failure here just leaves
  // harmless orphaned bytes in Storage, never a broken reference on the site
  // (the DB rows are already gone at this point either way).
  const images = product?.product_images ?? [];
  if (images.length) {
    const marker = `/${BUCKET}/`;
    const paths = images
      .map((img) => {
        const idx = img.url.indexOf(marker);
        return idx !== -1 ? img.url.slice(idx + marker.length) : null;
      })
      .filter((p): p is string => p !== null);
    if (paths.length) {
      const { error: storageError } = await supabaseAdmin.storage.from(BUCKET).remove(paths);
      if (storageError) {
        console.error("deleteProduct: storage cleanup failed:", storageError.message);
      }
    }
  }

  revalidateStorefront(product?.slug);
  redirect("/admin/products");
}

// ─── Image management (FLM-16) ───
// Each of these is its own small, independent action — unlike variants,
// images act on already-saved rows one at a time, so there's no "stage
// several changes, then submit once" step and no client state needed.

const BUCKET = "product-images";
const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // matches the bucket's own limit

async function revalidateProductPage(productId: string) {
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("slug")
    .eq("id", productId)
    .single();
  if (product) revalidatePath(`/product/${product.slug}`);
}

export async function uploadImagesAction(productId: string, formData: FormData) {
  await requireAdminSession();

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length) {
    const { data: existing } = await supabaseAdmin
      .from("product_images")
      .select("sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: false })
      .limit(1);
    let nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    for (const file of files) {
      // Client-side `accept="image/*"` isn't a security boundary — re-check
      // the real type and size server-side before trusting either.
      if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
        console.error(`uploadImagesAction: rejected ${file.name} (${file.type}, ${file.size}b)`);
        continue;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${productId}/${crypto.randomUUID()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type });
      if (uploadError) {
        console.error("uploadImagesAction: upload failed:", uploadError.message);
        continue;
      }

      const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
      const { error: insertError } = await supabaseAdmin.from("product_images").insert({
        product_id: productId,
        url: publicUrlData.publicUrl,
        sort_order: nextSortOrder++,
      });
      if (insertError) console.error("uploadImagesAction: insert failed:", insertError.message);
    }
  }

  await revalidateProductPage(productId);
  redirect(`/admin/products/${productId}/edit`);
}

export async function deleteImageAction(productId: string, imageId: string) {
  await requireAdminSession();

  const { data: image } = await supabaseAdmin
    .from("product_images")
    .select("url")
    .eq("id", imageId)
    .single();

  // Delete the DB row first: a failure here leaves a real image showing; a
  // failure in the storage cleanup below just leaves harmless orphaned
  // bytes. Never the reverse — that could show a broken image on the site.
  const { error } = await supabaseAdmin.from("product_images").delete().eq("id", imageId);

  if (error) {
    console.error("deleteImageAction failed:", error.message);
  } else if (image) {
    const marker = `/${BUCKET}/`;
    const idx = image.url.indexOf(marker);
    if (idx !== -1) {
      const path = image.url.slice(idx + marker.length);
      const { error: storageError } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
      if (storageError) {
        console.error("deleteImageAction: storage cleanup failed:", storageError.message);
      }
    }
  }

  await revalidateProductPage(productId);
  redirect(`/admin/products/${productId}/edit`);
}

export async function moveImageAction(
  productId: string,
  imageId: string,
  direction: "up" | "down"
) {
  await requireAdminSession();

  const { data: images } = await supabaseAdmin
    .from("product_images")
    .select("id, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  const idx = images?.findIndex((img) => img.id === imageId) ?? -1;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;

  if (images && idx !== -1 && swapIdx >= 0 && swapIdx < images.length) {
    const a = images[idx];
    const b = images[swapIdx];
    await supabaseAdmin.from("product_images").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabaseAdmin.from("product_images").update({ sort_order: a.sort_order }).eq("id", b.id);
    await revalidateProductPage(productId);
  }

  redirect(`/admin/products/${productId}/edit`);
}
