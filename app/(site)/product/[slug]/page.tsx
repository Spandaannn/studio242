import { notFound } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import VariantPicker from "@/components/VariantPicker";

// Same caveat as ProductGrid: the hand-written Database type doesn't encode
// relationships, so this nested select needs an explicit shape + cast.
interface ProductDetailData {
  id: string;
  name: string;
  description: string | null;
  product_images: { url: string; sort_order: number }[];
  variants: {
    id: string;
    size: string | null;
    color: string | null;
    price: number;
    stock: number;
  }[];
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, description, product_images(url, sort_order), variants(id, size, color, price, stock)"
    )
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) {
    notFound();
  }

  const product = data as unknown as ProductDetailData;
  const images = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex-1 bg-[var(--bg-1)]">
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-10 sm:px-12 md:grid-cols-2">
        <div className="space-y-3">
          {images.length > 0 ? (
            images.map((img, i) => (
              <div
                key={img.url}
                className="aspect-[3/4] overflow-hidden rounded-md border border-[var(--border)] bg-neutral-200"
              >
                <Image
                  src={img.url}
                  alt={product.name}
                  width={600}
                  height={800}
                  priority={i === 0}
                  className="h-full w-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="aspect-[3/4] rounded-md border border-[var(--border)] bg-neutral-200" />
          )}
        </div>

        <div>
          <h1 className="text-2xl font-light leading-snug tracking-wide">
            {product.name}
          </h1>
          <VariantPicker
            variants={product.variants}
            productId={product.id}
            productName={product.name}
            productSlug={slug}
            image={images[0]?.url ?? null}
          />
          {product.description && (
            // Description comes from Shopify's Body (HTML) field — the merchant's
            // own product copy, not user input, so rendering it as HTML is safe here.
            <div
              className="mt-8 max-w-none text-sm leading-relaxed text-[var(--text-muted)] [&_a]:text-[var(--accent-1)] [&_a]:underline [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
