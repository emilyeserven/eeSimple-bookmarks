/**
 * Convert a human name into a URL-friendly slug: lowercased, with every run of
 * non-alphanumeric characters collapsed to a single hyphen and leading/trailing
 * hyphens trimmed. Returns an empty string when the name has no usable characters.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Pick a slug for `name` that does not collide with `taken`. Appends `-2`, `-3`, …
 * to the base slug until it is unique. Falls back to `"category"` when `name`
 * slugifies to empty.
 */
export function uniqueSlug(name: string, taken: Iterable<string>): string {
  const base = slugify(name) || "category";
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}
