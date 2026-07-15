// @vitest-environment node

/**
 * Compose the "full path" a relative sections selector resolves to. The Extension Fill sections editor
 * has several selectors at different scopes — a page-level container / item selector, then name / link /
 * name-part selectors that are `querySelector`-ed **within** each item. Joining the ancestor chain with a
 * descendant combinator (a space) gives the effective selector, surfaced under each field so it is clear
 * what a "within each item" selector actually targets.
 *
 * Empty / whitespace-only segments are dropped, so an unset ancestor never leaves a dangling combinator.
 * The join is literal: if a user typed an absolute selector into a relative field, the redundant-looking
 * chain is itself the signal that the field wasn't meant to repeat the ancestor path.
 */
export function joinSelectorPath(...segments: (string | null | undefined)[]): string {
  return segments
    .map(segment => (segment ?? "").trim())
    .filter(Boolean)
    .join(" ");
}
