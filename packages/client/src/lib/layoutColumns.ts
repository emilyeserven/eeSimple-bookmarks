/**
 * Per-section ("group") column width for the Page Layouts editor (#1220). A layout section can set
 * `columns` (1–4); its fields render at `1/columns` width and overflow wraps to the next line. The
 * SAME mapping drives both the editor preview (`LayoutBoard`) and the real View/Edit pages
 * (`LayoutDrivenTabBody`), so what an operator arranges is what renders.
 *
 * Tailwind v4 only emits class names it can see verbatim in source, so the column classes are
 * listed as literals (a dynamic `grid-cols-${n}` would never be generated) — the same constraint
 * `bookmarkColumns.ts` `COLUMN_CLASS` already lives under.
 */

/** Column counts a section may span. `1` is the default full-width stack. */
export const SECTION_COLUMN_OPTIONS = [1, 2, 3, 4] as const;

const MIN_COLUMNS = 1;
const MAX_COLUMNS = 4;

/** Clamp an arbitrary (possibly stale/stored) column count into the supported `[1, 4]` range. */
export function clampSectionColumns(columns: number | undefined): number {
  if (!columns || !Number.isFinite(columns)) return MIN_COLUMNS;
  return Math.min(Math.max(Math.trunc(columns), MIN_COLUMNS), MAX_COLUMNS);
}

/**
 * The layout classes for a section body on the actual View/Edit pages. `1` keeps the exact current
 * full-width vertical stack (`space-y-6`, byte-identical default); `2`–`4` become a **container-query**
 * grid that reflows to N columns based on the section's own available width, not the viewport.
 *
 * These are `@`-prefixed **container** variants (Tailwind v4 `@container` / `@md`…, the same pattern
 * used by `BookmarkDetail.tsx` / `ui/card.tsx`), so the caller marks the section wrapper `@container`
 * (see `SectionFields` in `LayoutDrivenTabBody`). Viewport `md:` was wrong here: these surfaces render
 * in narrow containers (the Page Layouts preview is a 50/50 split-pane; the detail page is a single
 * column), so a viewport-gated `md:grid-cols-2` would be "on" while the pane was far too narrow —
 * the fields ended up cramped/stacked instead of laid out N-across. Higher counts degrade gracefully
 * (a 4-col section drops to 3→2→1 as the container narrows). `@md` ≈ 28rem, `@3xl` ≈ 48rem,
 * `@5xl` ≈ 64rem of container inline-size.
 */
const RENDER_CLASS: Record<number, string> = {
  1: "space-y-6",
  2: "grid gap-6 @md:grid-cols-2",
  3: "grid gap-6 @md:grid-cols-2 @3xl:grid-cols-3",
  4: "grid gap-6 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4",
};

/**
 * Section-body layout classes for a rendered page (see {@link RENDER_CLASS}). Applied to the grid
 * element; its wrapper must carry `@container` so the `@`-variants resolve against the section width.
 */
export function sectionColumnsClass(columns: number | undefined): string {
  return RENDER_CLASS[clampSectionColumns(columns)];
}

/**
 * The layout classes for the editor's field-chip preview. Always a fixed `grid-cols-N` (even for a
 * single column) at every breakpoint — the settings editor is a desktop surface and the preview
 * must mirror the chosen width exactly, so each chip spans `1/N` of the row: 1 col → full-width
 * (one chip per row), 2 → half, 3 → third, 4 → quarter, wrapping on overflow. (A `flex flex-wrap`
 * here would size chips to their content instead of the column, which is what the tray still uses.)
 */
const EDITOR_CLASS: Record<number, string> = {
  1: "grid grid-cols-1 gap-1.5",
  2: "grid grid-cols-2 gap-1.5",
  3: "grid grid-cols-3 gap-1.5",
  4: "grid grid-cols-4 gap-1.5",
};

/** Field-chip container classes for the editor preview (see {@link EDITOR_CLASS}). */
export function sectionColumnsEditorClass(columns: number | undefined): string {
  return EDITOR_CLASS[clampSectionColumns(columns)];
}
