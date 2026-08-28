import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Studio 242",
};

export default function AboutPage() {
  return (
    <main className="flex-1 bg-[var(--bg-1)]">
      <div className="mx-auto max-w-2xl px-6 py-14 sm:px-12">
        <h1 className="mb-8 text-center text-[30px] font-light tracking-wide">
          About Us
        </h1>
        <div className="space-y-5 text-[15px] leading-relaxed text-[var(--text-muted)]">
          <p>
            Our story begins in house number 242, a quaint little home in
            Bangalore where our inspiration lives.
          </p>
          <p>
            Growing up, we fell in love with the rich and vibrant culture of
            our country. The intricate handicraft of rural artisans,
            magnanimous monuments with spellbinding architecture, innumerous
            colours and flavours across states, and a never ending expanse of
            heritage. All of these have found a place in our hearts and fill
            us with pride. And now, we are on a journey to bring them to
            Indian Fusion Wear.
          </p>
          <p>
            We believe what we wear reflects who we are. So, we are proud to
            bring forth our culture and roots with a touch of modernity,
            comfort and style, not just to India, but to the world.
          </p>
          <p className="text-center text-[var(--text)]">We are Studio 242.</p>
        </div>
      </div>
    </main>
  );
}
