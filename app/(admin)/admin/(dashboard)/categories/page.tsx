import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { deleteCategory } from "@/app/(admin)/admin/(dashboard)/categories/actions";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export default async function AdminCategoriesPage() {
  const { data: categories, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("AdminCategoriesPage: failed to load categories:", error.message);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="rounded-md bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-300"
        >
          + New Category
        </Link>
      </div>

      <div className="overflow-hidden rounded-md border border-neutral-300 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-300 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Slug</th>
              <th className="px-4 py-2.5">Sort</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {(categories ?? []).map((category) => (
              <tr key={category.id} className="border-b border-neutral-200 last:border-0">
                <td className="px-4 py-2.5">{category.name}</td>
                <td className="px-4 py-2.5 text-neutral-500">{category.slug}</td>
                <td className="px-4 py-2.5 text-neutral-500">{category.sort_order}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/categories/${category.id}/edit`}
                      className="text-neutral-600 hover:text-neutral-900"
                    >
                      Edit
                    </Link>
                    <form action={deleteCategory.bind(null, category.id)}>
                      <ConfirmSubmitButton
                        confirmMessage={`Delete "${category.name}"? Products in it will become uncategorized, not deleted.`}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(categories ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
