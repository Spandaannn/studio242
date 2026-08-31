import Image from "next/image";
import {
  deleteImageAction,
  moveImageAction,
  uploadImagesAction,
} from "@/app/(admin)/admin/(dashboard)/products/actions";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

interface ProductImagesProps {
  productId: string;
  images: { id: string; url: string; sort_order: number }[];
}

// Upload/delete/reorder are each their own small independent form -> Server
// Action. Unlike variants, every one of these acts on an already-saved row,
// so a full round-trip per action is fine — no client state needed anywhere.
export function ProductImages({ productId, images }: ProductImagesProps) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <p className="mb-2 text-sm text-neutral-600">Photos</p>

      {sorted.length > 0 && (
        <div className="mb-4 grid grid-cols-4 gap-3">
          {sorted.map((image, i) => (
            <div key={image.id} className="space-y-1.5">
              <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-neutral-300 bg-neutral-100">
                <Image src={image.url} alt="" fill className="object-cover" sizes="150px" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-1">
                  <form action={moveImageAction.bind(null, productId, image.id, "up")}>
                    <button
                      type="submit"
                      disabled={i === 0}
                      className="text-neutral-600 hover:text-neutral-900 disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveImageAction.bind(null, productId, image.id, "down")}>
                    <button
                      type="submit"
                      disabled={i === sorted.length - 1}
                      className="text-neutral-600 hover:text-neutral-900 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                </div>
                <form action={deleteImageAction.bind(null, productId, image.id)}>
                  <ConfirmSubmitButton
                    confirmMessage="Delete this photo?"
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        action={uploadImagesAction.bind(null, productId)}
        className="flex items-center gap-3 rounded-md border border-dashed border-neutral-300 p-4"
      >
        <input
          type="file"
          name="files"
          multiple
          accept="image/*"
          className="flex-1 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Upload
        </button>
      </form>
    </div>
  );
}
