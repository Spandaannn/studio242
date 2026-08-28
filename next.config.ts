import type { NextConfig } from "next";

// Product photos live in Supabase Storage, same host as the database —
// read from the env var so this doesn't silently drift if the project changes.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      // Temporary — product_images still point at Shopify's CDN until
      // FLM-28 downloads and re-hosts them in Supabase Storage.
      {
        protocol: "https" as const,
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
