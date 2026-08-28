import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProductGrid from "@/components/ProductGrid";

export default async function CategoryPage(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;

  const { data: category, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (error || !category) {
    notFound();
  }

  return (
    <div className="flex-1 bg-[var(--bg-1)]">
      <div className="mx-auto max-w-5xl border-b border-[var(--border)] px-6 pb-6 pt-10 sm:px-12">
        <h1 className="text-[30px] font-light tracking-wide">{category.name}</h1>
      </div>
      <ProductGrid categoryId={category.id} />
    </div>
  );
}
