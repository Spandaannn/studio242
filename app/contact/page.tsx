import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Studio 242",
};

export default function ContactPage() {
  return (
    <main className="flex-1 bg-[var(--bg-1)]">
      <div className="mx-auto max-w-lg px-6 py-14 sm:px-12">
        <h1 className="mb-6 text-center text-[30px] font-light tracking-wide">
          Contact Us
        </h1>
        <p className="mb-10 text-center text-[15px] leading-relaxed text-[var(--text-muted)]">
          We are happy to hear from you and help find the right product!
        </p>

        <div className="space-y-6 rounded-md border border-[var(--border)] bg-[var(--bg-2)] p-8">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[var(--text-subtle)]">
              Email
            </p>
            <a
              href="mailto:care@studio242.co"
              className="text-[15px] hover:text-[var(--accent-2)]"
            >
              care@studio242.co
            </a>
          </div>

          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[var(--text-subtle)]">
              Call / WhatsApp
            </p>
            <a
              href="tel:+919606614186"
              className="text-[15px] hover:text-[var(--accent-2)]"
            >
              +91 96066 14186
            </a>
          </div>

          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[var(--text-subtle)]">
              Registered Address
            </p>
            <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">
              Villa #242, Phase 1,
              <br />
              Adarsh Palm Meadows,
              <br />
              HAL Airport – Varthur Main Road,
              <br />
              Ramagondanahalli, Bangalore – 560066
              <br />
              India
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/919606614186"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--accent-1)] py-3.5 text-sm tracking-wide text-[var(--button-label)] transition-colors hover:bg-[var(--accent-2)]"
        >
          Chat on WhatsApp
        </a>
      </div>
    </main>
  );
}
