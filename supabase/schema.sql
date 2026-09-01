-- ═══════════════════════════════════════════════════════════
-- Studio242 — Database Schema (FLM-04)
-- Run once in Supabase SQL Editor.
-- Idempotent-ish: uses IF NOT EXISTS so re-running is safe.
-- ═══════════════════════════════════════════════════════════

-- ─── CATEGORIES ───
-- Product groupings (was "collections" in Shopify).
-- slug = URL-friendly name ("silk-sarees"), used in /category/[slug]
-- image_url = curated hero photo for homepage tiles (added post-launch —
-- without it, the homepage fell back to "whichever product is newest",
-- which never matched the merchant's actual chosen collection photo).
create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  sort_order integer not null default 0,
  image_url  text,
  created_at timestamptz not null default now()
);

alter table categories add column if not exists image_url text;

-- ─── PRODUCTS ───
-- One row per product. Variants (size/color) live separately.
-- status: 'active' = visible publicly | 'inactive' = hidden, kept for records
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  status      text not null default 'active' check (status in ('active', 'inactive')),
  category_id uuid references categories(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ─── PRODUCT IMAGES ───
-- Multiple images per product; sort_order = gallery position.
-- url points to Supabase Storage (filled during Day 2 migration).
create table if not exists product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url        text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ─── VARIANTS ───
-- The buyable unit: "Kurta / Blue / M / ₹1499 / 12 in stock".
-- Price lives HERE, not on products — sizes can cost differently.
create table if not exists variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size       text,
  color      text,
  price      numeric(10,2) not null check (price >= 0),
  stock      integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);

-- ─── ORDERS ───
-- One row per checkout. Guest checkout = no user account needed.
-- status flows: pending_payment → paid → packed → shipped → delivered
--               (or cancelled, from any pre-shipped state)
create table if not exists orders (
  id         uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone      text not null,
  email      text,
  address    text not null,
  note       text,
  total      numeric(10,2) not null,
  payment_id text,
  status     text not null default 'pending_payment'
             check (status in ('pending_payment','paid','packed','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);

-- ─── ORDER ITEMS ───
-- Line items per order. price_at_purchase freezes the price at
-- order time so later price changes never rewrite history.
create table if not exists order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders(id) on delete cascade,
  variant_id        uuid references variants(id),
  qty               integer not null check (qty > 0),
  price_at_purchase numeric(10,2) not null,
  created_at        timestamptz not null default now()
);

-- ─── INDEXES ───
-- Indexes = the book's index page. Without one, finding all variants
-- of a product means scanning every row. With one, it's instant.
create index if not exists idx_products_category  on products(category_id);
create index if not exists idx_products_status    on products(status);
create index if not exists idx_variants_product   on variants(product_id);
create index if not exists idx_images_product     on product_images(product_id);
create index if not exists idx_orders_status      on orders(status);
create index if not exists idx_order_items_order  on order_items(order_id);
create index if not exists idx_order_items_variant on order_items(variant_id);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- RLS ON + no policy = locked door. Policies below open ONLY
-- the doors the public website needs. Admin write access is
-- deliberately NOT granted yet — hardened on Day 5 (FLM-25).
-- ═══════════════════════════════════════════════════════════

alter table categories      enable row level security;
alter table products        enable row level security;
alter table product_images  enable row level security;
alter table variants        enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;

-- Public visitors may READ the catalog — but only ACTIVE products
create policy "public_read_categories"
  on categories for select to anon using (true);

create policy "public_read_active_products"
  on products for select to anon using (status = 'active');

create policy "public_read_images"
  on product_images for select to anon using (true);

create policy "public_read_variants"
  on variants for select to anon using (true);

-- Orders: NO public policy at all. Anon can neither read nor write.
-- Writes happen through our server API routes (Day 4), which use
-- the admin session — not the public key.

-- ═══════════════════════════════════════════════════════════
-- FLM-25 CLOSED (2026-08-30) — no new policies were needed.
-- The admin panel (app/(admin)/admin/**) writes exclusively through
-- lib/supabase-admin.ts (service role key, bypasses RLS entirely) —
-- it never uses the anon key, so the locked-door state above is
-- exactly the finished, correct state. Verified with a smoke test:
-- anon-key insert/update/delete against every table above returns
-- 0 rows affected (no actual data mutation), confirmed against real
-- rows, not just empty-table false positives.
-- ═══════════════════════════════════════════════════════════
