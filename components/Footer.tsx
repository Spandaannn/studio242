import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[var(--accent-1)] px-6 py-10 text-[var(--button-label)] sm:px-12">
      <div className="mx-auto flex max-w-5xl flex-wrap gap-12">
        <div className="min-w-[220px] flex-1">
          <p className="mb-3.5 text-xs font-medium uppercase tracking-wide opacity-90">
            Quick links
          </p>
          <div className="flex flex-col gap-2.5 text-sm">
            <Link href="/contact" className="opacity-85 hover:opacity-100">
              Contact Us
            </Link>
            <Link href="/about" className="opacity-85 hover:opacity-100">
              About Us
            </Link>
          </div>
        </div>

        <div className="min-w-[220px] flex-1">
          <p className="mb-3.5 text-xs font-medium uppercase tracking-wide opacity-90">
            Our mission
          </p>
          <p className="text-[13px] leading-relaxed opacity-80">
            We believe what we wear reflects who we are. So, we are proud to bring
            forth our culture and roots with a touch of modernity, comfort and
            style, not just to India, but to the world.
          </p>
        </div>

        <div className="min-w-[220px] flex-1">
          <p className="mb-3.5 text-xs font-medium uppercase tracking-wide opacity-90">
            Terms and Conditions
          </p>
          <p className="text-[13px] leading-relaxed opacity-80">
            Items sold under sale price are not returnable and cannot be
            exchanged.
            <br />
            We request you to kindly check the size charts thoroughly before
            ordering.
            <br />
            Current Estimated Dispatch Time: 7-10 business days.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-5xl flex-wrap items-center justify-between gap-3.5 border-t border-white/15 pt-6">
        <span className="text-xs opacity-70">&copy; {new Date().getFullYear()} Studio 242</span>
        <div className="flex gap-4" aria-hidden>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" />
          </svg>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" />
          </svg>
        </div>
      </div>
    </footer>
  );
}
