import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import NavDropdown from "@/components/NavDropdown";

export default async function Header() {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("name, slug")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Header: failed to load categories:", error.message);
  }

  return (
    <header className="bg-[var(--bg-2)] text-[var(--text)]">
      <div className="bg-[var(--accent-1)] px-5 py-2.5 text-center text-[13px] tracking-wide text-[var(--button-label)]">
        Use code WELCOME10 for 10% off on your first order with us &nbsp;|&nbsp; Free
        shipping within India above ₹ 1000
      </div>

      <div className="flex items-center justify-between px-6 py-5 sm:px-12">
        <div aria-hidden className="flex items-center gap-5 text-[var(--text)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <Link href="/" className="text-lg font-semibold tracking-[0.2em]">
          STUDIO 242
        </Link>

        <div aria-hidden className="flex items-center gap-5 text-[var(--text)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
      </div>

      <nav className="flex flex-wrap items-center justify-center gap-8 border-t border-[var(--border)] px-6 py-3.5">
        <NavDropdown label="Shop" items={categories ?? []} />
        <Link href="/contact" className="text-[15px] tracking-wide">
          Contact Us
        </Link>
        <Link href="/about" className="text-[15px] tracking-wide">
          About Us
        </Link>
      </nav>
    </header>
  );
}
