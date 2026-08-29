// FLM-28: download every product_images.url (currently Shopify's CDN) and
// re-host it in Supabase Storage, then repoint the row at the new URL.
// Needed because Shopify's CDN stops being reliable once the subscription
// is cancelled — these images shouldn't depend on Shopify at all.
//
// Usage:
//   node scripts/migrate-images-to-storage.mjs --limit 5   (dry-run-ish test batch)
//   node scripts/migrate-images-to-storage.mjs             (full run)

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
const BUCKET = "product-images";
const CONCURRENCY = 8;

const limitArg = process.argv.indexOf("--limit");
const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : null;

function extFromUrl(url, contentType) {
  const path = new URL(url).pathname;
  const match = path.match(/\.([a-zA-Z0-9]+)$/);
  if (match) return match[1].toLowerCase();
  if (contentType?.includes("jpeg")) return "jpg";
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  return "jpg";
}

async function fetchWithRetry(url, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 500 * (i + 1))); // backoff
  }
  throw lastErr;
}

async function migrateOne(row) {
  // Already migrated (re-run safety) — skip.
  if (row.url.includes(`${env.NEXT_PUBLIC_SUPABASE_URL.replace("https://", "")}`)) {
    return { id: row.id, status: "skipped (already migrated)" };
  }

  let res;
  try {
    res = await fetchWithRetry(row.url);
  } catch (e) {
    return { id: row.id, status: `failed: fetch ${e.message}`, url: row.url };
  }
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = extFromUrl(row.url, contentType);
  const path = `${row.product_id}/${row.id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (uploadError) {
    return { id: row.id, status: `failed: upload ${uploadError.message}`, url: row.url };
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const newUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from("product_images")
    .update({ url: newUrl })
    .eq("id", row.id);
  if (updateError) {
    return { id: row.id, status: `failed: db update ${updateError.message}` };
  }

  return { id: row.id, status: "ok", newUrl };
}

async function fetchAllRows() {
  // Supabase/PostgREST caps a single select at 1000 rows — page through
  // with .range() or silently lose everything past row 1000.
  const PAGE_SIZE = 1000;
  const rows = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("product_images")
      .select("id, product_id, url")
      .order("id")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error("Fetch failed: " + error.message);
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
    if (limit && rows.length >= limit) break;
  }
  return limit ? rows.slice(0, limit) : rows;
}

async function main() {
  const rows = await fetchAllRows();

  console.log(`Migrating ${rows.length} images (concurrency ${CONCURRENCY})...`);

  let done = 0;
  const results = [];
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(migrateOne));
    results.push(...batchResults);
    done += batch.length;
    process.stdout.write(`\r${done}/${rows.length}`);
  }
  console.log();

  const ok = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status.startsWith("skipped")).length;
  const failed = results.filter((r) => r.status.startsWith("failed"));

  console.log(`\nDone: ${ok} migrated, ${skipped} already done, ${failed.length} failed.`);
  if (failed.length) {
    console.log("\nFailures:");
    for (const f of failed) console.log(` - ${f.id}: ${f.status} (${f.url ?? ""})`);
  }
}

main();
