"use client";

import { useState } from "react";
import Link from "next/link";

interface NavDropdownProps {
  label: string;
  items: { name: string; slug: string }[];
}

export default function NavDropdown({ label, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1.5 text-[15px] tracking-wide text-[var(--text)]"
      >
        {label}
        <span
          aria-hidden
          className="mt-[-2px] h-[7px] w-[7px] border-r-[1.5px] border-b-[1.5px] border-current rotate-45"
        />
      </button>
      {open && (
        <div className="absolute left-1/2 top-7 z-20 flex min-w-[190px] -translate-x-1/2 flex-col gap-2.5 rounded-md border border-[var(--border)] bg-[var(--bg-2)] p-4 shadow-lg">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/category/${item.slug}`}
              className="whitespace-nowrap text-sm text-[var(--text)] hover:text-[var(--accent-2)]"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
