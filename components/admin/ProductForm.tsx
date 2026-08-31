import { VariantsEditor } from "@/components/admin/VariantsEditor";

interface Variant {
  id?: string;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
}

interface ProductFormProps {
  action: (formData: FormData) => void | Promise<void>;
  categories: { id: string; name: string }[];
  defaultValues?: {
    name: string;
    slug: string;
    description: string | null;
    status: "active" | "inactive";
    category_id: string | null;
  };
  variants?: Variant[];
  error?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  "missing-fields": "Name is required.",
  "slug-taken": "That slug is already used by another product.",
  variants: "Product saved, but a size/color/price/stock row had a problem — check them below.",
  unknown: "Something went wrong saving this product.",
};

export function ProductForm({
  action,
  categories,
  defaultValues,
  variants,
  error,
}: ProductFormProps) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unknown}
        </p>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm text-neutral-600">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="slug" className="mb-1 block text-sm text-neutral-600">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          placeholder="leave blank to generate from name"
          defaultValue={defaultValues?.slug}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-neutral-500">Used in the URL: /product/&lt;slug&gt;</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category_id" className="mb-1 block text-sm text-neutral-600">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={defaultValues?.category_id ?? ""}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">— Uncategorized —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm text-neutral-600">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? "active"}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="active">Active (visible on site)</option>
            <option value="inactive">Inactive (hidden)</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm text-neutral-600">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={defaultValues?.description ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Basic HTML tags work here (&lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;&lt;li&gt;) — this is
          shown as-is on the product page.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm text-neutral-600">Sizes / Colors / Prices / Stock</p>
        <VariantsEditor initialVariants={variants ?? []} />
      </div>

      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Save
      </button>
    </form>
  );
}
