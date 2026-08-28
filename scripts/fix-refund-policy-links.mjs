// One-time fix: product descriptions imported from Shopify contain a hardcoded
// link to the old handcraftedgoodness.in refund policy page. Point them at our
// own /refund-policy instead. Uses the service role key since this writes to
// a table anon can only read (see scripts/import-shopify.mjs for why).

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

const OLD_LINK = "https://handcraftedgoodness.in/policies/refund-policy";
const NEW_LINK = "/refund-policy";

const { data: products, error } = await supabase
  .from("products")
  .select("id, description")
  .like("description", `%${OLD_LINK}%`);

if (error) throw new Error("Fetch failed: " + error.message);

console.log(`Found ${products.length} products with the old refund-policy link.`);

let updated = 0;
for (const p of products) {
  const fixed = p.description.replaceAll(OLD_LINK, NEW_LINK);
  const { error: updateError } = await supabase
    .from("products")
    .update({ description: fixed })
    .eq("id", p.id);
  if (updateError) {
    console.error(`Failed to update ${p.id}:`, updateError.message);
    continue;
  }
  updated++;
}

console.log(`Updated ${updated} products.`);
