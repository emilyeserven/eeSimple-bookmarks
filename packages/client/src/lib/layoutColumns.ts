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
 * full-width vertical stack (`space-y-6`, byte-identical default); `2`–`4` become a responsive grid
 * that stacks to one column below `md` and reflows to N columns at `md+`.
 */
const RENDER_CLASS: Record<number, string> = {
  1: "space-y-6",
  2: "grid gap-6 md:grid-cols-2",
  3: "grid gap-6 md:grid-cols-3",
  4: "grid gap-6 md:grid-cols-4",
};

/** Section-body layout classes for a rendered page (see {@link RENDER_CLASS}). */
export function sectionColumnsClass(columns: number | undefined): string {
  return RENDER_CLASS[clampSectionColumns(columns)];
}

/**
 * The layout classes for the editor's field-chip preview. Unlike the render classes these apply the
 * column count at every breakpoint (the settings editor is a desktop surface and the preview should
 * mirror the chosen width immediately), so a 2-column group shows half-width chips right away.
 */
const EDITOR_CLASS: Record<number, string> = {
  1: "flex flex-wrap gap-1.5",
  2: "grid grid-cols-2 gap-1.5",
  3: "grid grid-cols-3 gap-1.5",
  4: "grid grid-cols-4 gap-1.5",
};

/** Field-chip container classes for the editor preview (see {@link EDITOR_CLASS}). */
export function sectionColumnsEditorClass(columns: number | undefined): string {
  return EDITOR_CLASS[clampSectionColumns(columns)];
}
