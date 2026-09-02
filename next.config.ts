import type { NextConfig } from "next";

// Product photos live in Supabase Storage, same host as the database —
// read from the env var so this doesn't silently drift if the project changes.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https" as const,
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // cdn.shopify.com removed — FLM-28 re-hosted every product image to
    // Supabase Storage, so the site no longer depends on Shopify at all.

    // Render's free-tier instance is capped at 512MB RAM. Next's built-in
    // image optimizer resizes/re-encodes every image server-side, per
    // request, per unique size — that's what was actually crashing the
    // instance (OOM, visible as "bad gateway" + missing images until
    // Render auto-restarted it). Supabase Storage already serves
    // reasonably-sized files, so there's nothing to gain from re-processing
    // them again on a memory-constrained host — skip it entirely.
    unoptimized: true,
  },
};

export default nextConfig;
