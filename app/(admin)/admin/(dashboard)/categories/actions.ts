"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { slugify } from "@/lib/slug";

function readCategoryFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(rawSlug || name);
  const sortOrder = parseInt(String(formData.get("sort_order") ?? ""), 10) || 0;
  const imageUrl = String(formData.get("image_url") ?? "").trim() || null;
  return { name, slug, sortOrder, imageUrl };
}

export async function createCategory(formData: FormData) {
  await requireAdminSession();
  const { name, slug, sortOrder, imageUrl } = readCategoryFields(formData);

  if (!name || !slug) {
    redirect("/admin/categories/new?error=missing-fields");
  }

  const { error } = await supabaseAdmin.from("categories").insert({
    name,
    slug,
    sort_order: sortOrder,
    image_url: imageUrl,
  });

  if (error) {
    // 23505 = Postgres unique-violation — the slug is already taken.
    redirect(`/admin/categories/new?error=${error.code === "23505" ? "slug-taken" : "unknown"}`);
  }

  // Categories show up on the homepage collage and in the Header nav on
  // every storefront page — bust the whole (site) layout subtree, not just
  // one route, so the change shows up everywhere immediately.
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdminSession();
  const { name, slug, sortOrder, imageUrl } = readCategoryFields(formData);

  if (!name || !slug) {
    redirect(`/admin/categories/${id}/edit?error=missing-fields`);
  }

  const { error } = await supabaseAdmin
    .from("categories")
    .update({ name, slug, sort_order: sortOrder, image_url: imageUrl })
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/categories/${id}/edit?error=${error.code === "23505" ? "slug-taken" : "unknown"}`
    );
  }

  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdminSession();

  // products.category_id is ON DELETE SET NULL — this never fails or
  // cascades into deleting products, it just uncategorizes them.
  const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);

  if (error) {
    console.error("deleteCategory failed:", error.message);
  }

  revalidatePath("/", "layout");
  redirect("/admin/categories");
}
