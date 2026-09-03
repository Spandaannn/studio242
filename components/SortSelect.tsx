"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const SORT_LABELS: Record<string, string> = {
  newest: "Newest",
  oldest: "Oldest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A-Z",
  "name-desc": "Name: Z-A",
};

interface SortSelectProps {
  currentSort: string;
}

// Category pages only (per plan) — the homepage's <ProductGrid /> call
// passes no `sort` prop and renders no sort control at all.
export default function SortSelect({ currentSort }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={currentSort}
      onChange={handleChange}
      aria-label="Sort products"
      className="rounded-md border border-[var(--border)] bg-[var(--bg-2)] px-3 py-1.5 text-sm text-[var(--text)]"
    >
      {Object.entries(SORT_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
