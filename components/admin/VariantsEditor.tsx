"use client";

import { useState } from "react";

interface Variant {
  id?: string;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
}

interface VariantsEditorProps {
  initialVariants: Variant[];
}

// The only "use client" component in the whole product form. It manages
// ROW COUNT only (add/remove blank rows) — the actual field values stay as
// ordinary uncontrolled `name="variants[N].field"` inputs, so plain
// `FormData` on submit captures whatever's on the page. React never needs
// to own the size/color/price/stock values, only which rows exist.
let nextKey = 0;

export function VariantsEditor({ initialVariants }: VariantsEditorProps) {
  const [rows, setRows] = useState(() =>
    initialVariants.map((v) => ({ key: nextKey++, variant: v }))
  );

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: nextKey++, variant: { size: null, color: null, price: 0, stock: 0 } },
    ]);
  }

  function removeRow(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="pb-2 pr-2">Size</th>
            <th className="pb-2 pr-2">Color</th>
            <th className="pb-2 pr-2">Price (₹)</th>
            <th className="pb-2 pr-2">Stock</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.key}>
              {row.variant.id && (
                <input type="hidden" name={`variants[${i}].id`} defaultValue={row.variant.id} />
              )}
              <td className="py-1 pr-2">
                <input
                  name={`variants[${i}].size`}
                  defaultValue={row.variant.size ?? ""}
                  placeholder="M"
                  className="w-20 rounded-md border border-neutral-300 px-2 py-1.5"
                />
              </td>
              <td className="py-1 pr-2">
                <input
                  name={`variants[${i}].color`}
                  defaultValue={row.variant.color ?? ""}
                  placeholder="Blue"
                  className="w-24 rounded-md border border-neutral-300 px-2 py-1.5"
                />
              </td>
              <td className="py-1 pr-2">
                <input
                  name={`variants[${i}].price`}
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={row.variant.price}
                  className="w-24 rounded-md border border-neutral-300 px-2 py-1.5"
                />
              </td>
              <td className="py-1 pr-2">
                <input
                  name={`variants[${i}].stock`}
                  type="number"
                  min="0"
                  defaultValue={row.variant.stock}
                  className="w-20 rounded-md border border-neutral-300 px-2 py-1.5"
                />
              </td>
              <td className="py-1">
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 text-sm text-neutral-600 hover:text-neutral-900"
      >
        + Add variant
      </button>
    </div>
  );
}
