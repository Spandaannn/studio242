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
  },
};

export default nextConfig;
