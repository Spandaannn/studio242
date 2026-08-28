import Image from "next/image";
import Link from "next/link";
import { getCategoryTile } from "@/lib/homepage";

export default async function Home() {
  const [dresses, coordSets, topWear, pajamaSets, bottomWear] = await Promise.all([
    getCategoryTile("dresses"),
    getCategoryTile("co-ord-sets"),
    getCategoryTile("top-wear"),
    getCategoryTile("pajama-sets"),
    getCategoryTile("bottom-wear"),
  ]);

  return (
    <main className="flex-1 bg-[var(--bg-1)]">
      <section className="mx-auto max-w-3xl px-6 py-11 text-center sm:px-12">
        <h1 className="mb-5 text-[34px] font-light tracking-wide text-balance">
          Reinventing Indian Style for the Modern Era
        </h1>
        <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">
          Welcome to Studio 242, where creativity and elegance intertwine. Prepare
          to be captivated by our exquisite designs and premium craftsmanship. We
          invite you to uncover the magic that lies within.
        </p>
      </section>

      <div className="mx-auto max-w-5xl px-6 sm:px-12">
        <div className="grid grid-cols-2 gap-5">
          <CollageTile tile={dresses} fallbackSrc="/marketing/dresses.jpg" />
          <CollageTile tile={coordSets} fallbackSrc="/marketing/coord-sets.jpg" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 pb-9 sm:grid-cols-3">
          <CollectionCard tile={topWear} fallbackSrc="/marketing/top-wear.jpg" />
          <CollectionCard tile={pajamaSets} fallbackSrc="/marketing/pajama-sets.jpg" />
          <CollectionCard tile={bottomWear} fallbackSrc="/marketing/bottom-wear.jpg" />
        </div>
      </div>

      <section className="mx-auto max-w-2xl px-6 py-11 text-center sm:px-12">
        <p className="text-lg font-light leading-relaxed">
          Each product at Studio 242 is created thoughtfully with a lot of respect
          for people we work with and our customers. Timeless essentials that
          spell effortless style.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-9 text-center sm:grid-cols-3 sm:px-12">
        <Testimonial
          quote="I wore Brunch Affair today and lots of ladies asked me about it. This dress you have totally nailed it"
          by="Madhavi, Bangalore, KA"
        />
        <Testimonial
          quote="Wowwww love love love your collection. So chic!"
          by="Prachi, SD, US"
        />
        <Testimonial
          quote="Received the dress and the fit is perfect. Thank you so much. Looking forward to purchase more from you"
          by="Sowmiya, Chennai, TN"
        />
      </section>

      <section className="bg-[var(--accent-1)] px-6 py-14 text-center text-[var(--button-label)] sm:px-12">
        <h2 className="mb-3.5 text-2xl font-light">Stay connected</h2>
        <p className="mb-6 text-sm opacity-85">
          Subscribe to our mailing list for insider news, product launches, and
          more.
        </p>
        <form className="mx-auto flex max-w-sm justify-center gap-2.5">
          <input
            type="email"
            placeholder="Email"
            disabled
            title="Coming soon"
            className="flex-1 rounded-md border border-white/40 bg-transparent px-4 py-3 text-sm text-[var(--button-label)] placeholder:text-white/60"
          />
          <button
            type="button"
            disabled
            title="Coming soon"
            className="rounded-md bg-[var(--bg-1)] px-6 text-sm tracking-wide text-[var(--accent-1)] disabled:cursor-not-allowed"
          >
            Subscribe
          </button>
        </form>
      </section>
    </main>
  );
}

function CollageTile({
  tile,
  fallbackSrc,
}: {
  tile: { name: string; slug: string; image: string | null } | null;
  fallbackSrc: string;
}) {
  if (!tile) return null;
  return (
    <Link
      href={`/category/${tile.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-md bg-neutral-200"
    >
      <Image
        src={tile.image ?? fallbackSrc}
        alt={tile.name}
        fill
        className="object-cover transition-transform group-hover:scale-105"
      />
      <span className="absolute bottom-5 left-5 rounded-md bg-[var(--bg-1)] px-4 py-2 text-sm tracking-wide text-[var(--text)]">
        {tile.name}
      </span>
    </Link>
  );
}

function CollectionCard({
  tile,
  fallbackSrc,
}: {
  tile: { name: string; slug: string; image: string | null } | null;
  fallbackSrc: string;
}) {
  if (!tile) return null;
  return (
    <Link href={`/category/${tile.slug}`} className="group block">
      <div className="aspect-[3/4] overflow-hidden rounded-md bg-neutral-200">
        <Image
          src={tile.image ?? fallbackSrc}
          alt={tile.name}
          width={400}
          height={533}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <p className="mt-3 text-center text-[15px]">{tile.name}</p>
    </Link>
  );
}

function Testimonial({ quote, by }: { quote: string; by: string }) {
  return (
    <div>
      <p className="mb-3.5 text-[15px] leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <p className="text-sm italic text-[var(--text-subtle)]">{by}</p>
    </div>
  );
}
