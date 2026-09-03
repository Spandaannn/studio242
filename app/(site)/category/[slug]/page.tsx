import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProductGrid from "@/components/ProductGrid";
import SortSelect from "@/components/SortSelect";

const VALID_SORTS = [
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "name-asc",
  "name-desc",
];

export default async function CategoryPage(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;

  const { data: category, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (error || !category) {
    notFound();
  }

  const sortParam = typeof searchParams.sort === "string" ? searchParams.sort : "newest";
  const sort = VALID_SORTS.includes(sortParam) ? sortParam : "newest";

  return (
    <div className="flex-1 bg-[var(--bg-1)]">
      <div className="mx-auto flex max-w-5xl items-end justify-between border-b border-[var(--border)] px-6 pb-6 pt-10 sm:px-12">
        <h1 className="text-[30px] font-light tracking-wide">{category.name}</h1>
        <SortSelect currentSort={sort} />
      </div>
      <ProductGrid categoryId={category.id} sort={sort} />
    </div>
  );
}
