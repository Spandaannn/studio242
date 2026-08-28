// One-time: set the curated homepage hero photo for each featured category.
// These match the exact images studio242.co assigns to its collection tiles
// (verified against the live site's DOM, not guessed) — stored as local
// /public/marketing paths rather than product photos, since these are
// site-decoration assets, not catalog data.

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const updates = [
  { slug: "dresses", image_url: "/marketing/dresses.jpg" },
  { slug: "co-ord-sets", image_url: "/marketing/coord-sets.jpg" },
  { slug: "top-wear", image_url: "/marketing/top-wear.jpg" },
  { slug: "pajama-sets", image_url: "/marketing/pajama-sets.jpg" },
  { slug: "kurtis", image_url: "/marketing/dresses.jpg" }, // stand-in "Bestsellers" tile — see FLM notes
];

for (const { slug, image_url } of updates) {
  const { error, count } = await supabase
    .from("categories")
    .update({ image_url })
    .eq("slug", slug)
    .select("id", { count: "exact" });
  if (error) {
    console.error(`Failed for ${slug}:`, error.message);
  } else {
    console.log(`${slug} -> ${image_url} (${count} row updated)`);
  }
}
