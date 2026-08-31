interface CategoryFormProps {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: {
    name: string;
    slug: string;
    sort_order: number;
    image_url: string | null;
  };
  error?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  "missing-fields": "Name is required.",
  "slug-taken": "That slug is already used by another category.",
  unknown: "Something went wrong saving this category.",
};

// Plain fields, no dynamic sub-list — no client JS needed at all here.
export function CategoryForm({ action, defaultValues, error }: CategoryFormProps) {
  return (
    <form action={action} className="max-w-md space-y-4">
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
        <p className="mt-1 text-xs text-neutral-500">Used in the URL: /category/&lt;slug&gt;</p>
      </div>

      <div>
        <label htmlFor="sort_order" className="mb-1 block text-sm text-neutral-600">
          Sort order
        </label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          defaultValue={defaultValues?.sort_order ?? 0}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-neutral-500">Lower numbers appear first in the nav.</p>
      </div>

      <div>
        <label htmlFor="image_url" className="mb-1 block text-sm text-neutral-600">
          Homepage image path
        </label>
        <input
          id="image_url"
          name="image_url"
          placeholder="/marketing/example.jpg"
          defaultValue={defaultValues?.image_url ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Leave blank to fall back to that category&apos;s newest product photo.
        </p>
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
