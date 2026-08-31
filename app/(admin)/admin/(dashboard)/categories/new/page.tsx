import { CategoryForm } from "@/components/admin/CategoryForm";
import { createCategory } from "@/app/(admin)/admin/(dashboard)/categories/actions";

export default async function NewCategoryPage(props: PageProps<"/admin/categories/new">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : undefined;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">New Category</h1>
      <CategoryForm action={createCategory} error={error} />
    </div>
  );
}
