// One-time migration: Shopify products CSV -> Supabase (categories, products,
// variants, product_images). Uses the service role key to bypass RLS, since
// no write policies exist yet (that's FLM-25, deliberately deferred).
//
// Usage: node scripts/import-shopify.mjs [path-to-csv]
// Defaults to the file dropped in Downloads during this migration.

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ── Load .env.local manually — this runs outside Next.js, which is the
// only thing that reads .env.local automatically. ──
const envPath = new URL("../.env.local", import.meta.url);
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey || serviceKey.includes("paste-your")) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// ── CSV parsing (handles quoted fields with embedded commas/newlines) ──
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        // skip
      } else field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Type code -> category name. Anything not listed falls through to the
// tag/title heuristics below (see categoryFor). ──
const TYPE_TO_CATEGORY = {
  DRESS: "Dresses",
  TP: "Top Wear",
  Kurti: "Kurtis",
  Dupatta: "Dupattas",
  CRDST: "Co-ord Sets",
  Jewellery: "Jewellery",
  "Jewellery Sets": "Jewellery",
  Shawl: "Shawls",
  BT: "Bottom Wear",
  Stole: "Stoles",
  Saree: "Sarees",
  DM: "Dress Materials",
  SS: "SS",
  Kaftan: "Kaftans",
  MSHRT: "Men's Shirts",
  MENSHIRT: "Men's Shirts",
  Bedcovers: "Bedcovers",
  Placemats: "Home Linen",
  TR: "Home Linen",
};

function categoryFor(type, tags, title) {
  if (type && TYPE_TO_CATEGORY[type]) return TYPE_TO_CATEGORY[type];

  const hasTag = (t) => tags.includes(t);
  if (hasTag("ACS") || hasTag("CTS") || hasTag("AC") || hasTag("HB") || hasTag("SB"))
    return "Accessories";
  if (hasTag("JMPRMP")) return "Jumpsuits & Rompers";
  if (hasTag("PJ")) return "Pajama Sets";
  if (hasTag("Dupattas")) return "Dupattas";

  const t = title.toLowerCase();
  if (t.includes("dress")) return "Dresses";
  if (t.includes("co-ord set")) return "Co-ord Sets";
  if (t.includes("kaftan")) return "Kaftans";
  if (t.includes("fabric")) return "Dress Materials";

  return "Uncategorized";
}

// ── Load + group rows by product ──
const csvPath = process.argv[2] || "C:/Users/Spandan/Downloads/products_export_1.csv";
const rows = parseCSV(readFileSync(csvPath, "utf8"));
const header = rows[0];
const idx = (name) => header.indexOf(name);
const col = {
  handle: idx("Handle"),
  title: idx("Title"),
  body: idx("Body (HTML)"),
  type: idx("Type"),
  tags: idx("Tags"),
  status: idx("Status"),
  opt1Name: idx("Option1 Name"),
  opt1Value: idx("Option1 Value"),
  opt2Name: idx("Option2 Name"),
  opt2Value: idx("Option2 Value"),
  price: idx("Variant Price"),
  qty: idx("Variant Inventory Qty"),
  sku: idx("Variant SKU"),
  imageSrc: idx("Image Src"),
  imagePos: idx("Image Position"),
};

const dataRows = rows.slice(1).filter((r) => r.length === header.length);

const products = new Map(); // handle -> { title, body, type, tags, status, opt1Name, opt2Name, variants: [], images: [] }
let current = null;

for (const r of dataRows) {
  const handle = r[col.handle];
  if (r[col.title]?.trim()) {
    current = {
      handle,
      title: r[col.title].trim(),
      body: r[col.body] || "",
      type: r[col.type]?.trim(),
      tags: (r[col.tags] || "").split(",").map((t) => t.trim()).filter(Boolean),
      status: r[col.status]?.trim(),
      opt1Name: r[col.opt1Name]?.trim(),
      opt2Name: r[col.opt2Name]?.trim(),
      variants: [],
      images: [],
    };
    products.set(handle, current);
  }
  const p = products.get(handle);
  if (!p) continue; // shouldn't happen — first row always establishes the product

  // Variant row: has a price.
  const priceRaw = r[col.price]?.trim();
  if (priceRaw) {
    let size = null;
    let color = null;
    if (p.opt1Name === "Size") size = r[col.opt1Value]?.trim() || null;
    else if (p.opt1Name === "Color") color = r[col.opt1Value]?.trim() || null;
    if (p.opt2Name === "Color") color = r[col.opt2Value]?.trim() || null;

    p.variants.push({
      size,
      color,
      price: parseFloat(priceRaw),
      // Shopify allows negative inventory (overselling/backorders); our
      // schema doesn't, so floor at 0 — "nothing in hand right now."
      stock: Math.max(0, parseInt(r[col.qty], 10) || 0),
    });
  }

  // Image row: any row can carry an image.
  const imgSrc = r[col.imageSrc]?.trim();
  if (imgSrc) {
    p.images.push({
      url: imgSrc,
      position: parseInt(r[col.imagePos], 10) || 0,
    });
  }
}

console.log(`Parsed ${products.size} products from ${csvPath}`);

// ── Build category list ──
const categoryNames = new Set();
for (const p of products.values()) {
  categoryNames.add(categoryFor(p.type, p.tags, p.title));
}
console.log(`\n${categoryNames.size} categories:`, [...categoryNames].join(", "));

// ── Reset target tables (safe: confirmed empty before this migration; this
// guards against accidentally double-running the import). Deleted in FK order. ──
console.log("\nClearing existing rows (product_images, variants, products, categories)...");
await supabase.from("product_images").delete().not("id", "is", null);
await supabase.from("variants").delete().not("id", "is", null);
await supabase.from("products").delete().not("id", "is", null);
await supabase.from("categories").delete().not("id", "is", null);

// ── Insert categories, keep a name -> id map ──
const categoryRows = [...categoryNames].map((name, i) => ({
  name,
  slug: slugify(name),
  sort_order: i,
}));
const { data: insertedCategories, error: catErr } = await supabase
  .from("categories")
  .insert(categoryRows)
  .select("id, name");
if (catErr) throw new Error("Category insert failed: " + catErr.message);
const categoryIdByName = new Map(insertedCategories.map((c) => [c.name, c.id]));
console.log(`Inserted ${insertedCategories.length} categories.`);

// ── Insert products in chunks, keep handle -> id map ──
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const productList = [...products.values()];
const productRows = productList.map((p) => ({
  name: p.title,
  slug: p.handle,
  description: p.body || null,
  status: p.status === "active" ? "active" : "inactive",
  category_id: categoryIdByName.get(categoryFor(p.type, p.tags, p.title)),
}));

const productIdByHandle = new Map();
for (const batch of chunk(productRows, 200)) {
  const { data, error } = await supabase.from("products").insert(batch).select("id, slug");
  if (error) throw new Error("Product insert failed: " + error.message);
  for (const row of data) productIdByHandle.set(row.slug, row.id);
}
console.log(`Inserted ${productIdByHandle.size} products.`);

// ── Insert variants ──
const variantRows = [];
for (const p of productList) {
  const productId = productIdByHandle.get(p.handle);
  for (const v of p.variants) {
    variantRows.push({
      product_id: productId,
      size: v.size,
      color: v.color,
      price: v.price,
      stock: v.stock,
    });
  }
}
let variantCount = 0;
for (const batch of chunk(variantRows, 500)) {
  const { error } = await supabase.from("variants").insert(batch);
  if (error) throw new Error("Variant insert failed: " + error.message);
  variantCount += batch.length;
}
console.log(`Inserted ${variantCount} variants.`);

// ── Insert images (dedupe by url per product, reindex sort_order) ──
const imageRows = [];
for (const p of productList) {
  const productId = productIdByHandle.get(p.handle);
  const seen = new Set();
  const unique = [];
  for (const img of p.images.sort((a, b) => a.position - b.position)) {
    if (seen.has(img.url)) continue;
    seen.add(img.url);
    unique.push(img.url);
  }
  unique.forEach((url, i) => {
    imageRows.push({ product_id: productId, url, sort_order: i });
  });
}
let imageCount = 0;
for (const batch of chunk(imageRows, 500)) {
  const { error } = await supabase.from("product_images").insert(batch);
  if (error) throw new Error("Image insert failed: " + error.message);
  imageCount += batch.length;
}
console.log(`Inserted ${imageCount} images.`);

console.log("\nDone.");
