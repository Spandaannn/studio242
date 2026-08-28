"use client";

import { useMemo, useState } from "react";

interface Variant {
  id: string;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
}

interface VariantPickerProps {
  variants: Variant[];
}

export default function VariantPicker({ variants }: VariantPickerProps) {
  const sizes = useMemo(
    () => [...new Set(variants.map((v) => v.size).filter((s): s is string => !!s))],
    [variants]
  );
  const colors = useMemo(
    () => [...new Set(variants.map((v) => v.color).filter((c): c is string => !!c))],
    [variants]
  );

  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null);

  const selectedVariant = useMemo(
    () =>
      variants.find(
        (v) =>
          (sizes.length === 0 || v.size === selectedSize) &&
          (colors.length === 0 || v.color === selectedColor)
      ),
    [variants, selectedSize, selectedColor, sizes.length, colors.length]
  );

  const pillClass = (active: boolean) =>
    `min-w-[46px] rounded-full border px-4 py-2.5 text-sm transition-colors ${
      active
        ? "border-[var(--accent-1)] bg-[var(--accent-1)] text-[var(--button-label)]"
        : "border-[var(--text)]/35 hover:border-[var(--text)]/60"
    }`;

  return (
    <div className="mt-6 space-y-5">
      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-[var(--text-subtle)]">
            Size
          </p>
          <div className="flex flex-wrap gap-2.5">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={pillClass(selectedSize === size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-[var(--text-subtle)]">
            Color
          </p>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={pillClass(selectedColor === color)}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pt-1">
        {selectedVariant ? (
          <>
            <p className="text-xl font-light">
              ₹ {selectedVariant.price.toLocaleString("en-IN")}
            </p>
            <p
              className={`mt-1 text-sm ${
                selectedVariant.stock > 0 ? "text-[var(--accent-2)]" : "text-red-600"
              }`}
            >
              {selectedVariant.stock > 0
                ? `${selectedVariant.stock} in stock`
                : "Out of stock"}
            </p>
            <button
              type="button"
              disabled={selectedVariant.stock === 0}
              className="mt-4 w-full rounded-md bg-[var(--accent-1)] py-3.5 text-sm tracking-wide text-[var(--button-label)] transition-colors hover:bg-[var(--accent-2)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {/* Cashfree checkout lands in FLM-17 — this button is a placeholder until then. */}
              {selectedVariant.stock > 0 ? "Buy Now — coming soon" : "Out of stock"}
            </button>
          </>
        ) : (
          <p className="text-sm text-[var(--text-subtle)]">
            This combination isn&apos;t available.
          </p>
        )}
      </div>
    </div>
  );
}
