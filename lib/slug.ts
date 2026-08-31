// Normalizes whatever an admin typed into a URL-safe slug, regardless of
// input — lowercased, spaces/punctuation collapsed to single hyphens, no
// leading/trailing hyphens. Used for both categories.slug and products.slug.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
