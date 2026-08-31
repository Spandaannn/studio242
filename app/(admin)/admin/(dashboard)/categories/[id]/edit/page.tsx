import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { updateCategory } from "@/app/(admin)/admin/(dashboard)/categories/actions";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function EditCategoryPage(
  props: PageProps<"/admin/categories/[id]/edit">
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : undefined;

  const { data: category } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug, sort_order, image_url")
    .eq("id", id)
    .single();

  if (!category) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Edit {category.name}</h1>
      <CategoryForm
        action={updateCategory.bind(null, category.id)}
        defaultValues={category}
        error={error}
      />
    </div>
  );
}
