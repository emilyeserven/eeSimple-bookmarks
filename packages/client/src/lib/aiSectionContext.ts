/**
 * Render a bookmark's `sections` property value as detailed, AI-readable context. Prompts routinely
 * ask about the section list itself ("which chapters cover X", "what have I not finished yet"), so
 * the context block spells out every entry — name, positional value, link, completion, progress
 * exclusion, favorite flag and tags — instead of the bare "N sections" count it used to emit.
 *
 * Pure — no hooks, no I/O — and unit-tested directly. Consumed by the shared per-bookmark context
 * block (`aiBookmarkContext.ts`) and the single-bookmark AI tab's prompt (`bookmarkAiUpdate.ts`)
 * through `propertyCurrentDisplay`.
 */

import type { BookmarkSectionsValue, SectionEntry } from "@eesimple/types";

import { countSectionLeaves, SECTION_ENTRY_TYPE_LABELS } from "@eesimple/types";

import { sectionEntryLink, sectionEntryPositional } from "./propertyFormat";

/**
 * Rendered rows (parents + children) beyond this cap are replaced by an "… N more" note. A section
 * list can run to hundreds of entries and every AI prompt embeds one block per targeted bookmark, so
 * an unbounded render can bury the question itself.
 */
export const AI_SECTION_CONTEXT_ROW_LIMIT = 300;

export interface AiSectionContextOptions {
  /** Tag id → name, so a section's `tagIds` render as names. Unresolvable ids are skipped. */
  tagNameById?: ReadonlyMap<string, string>;
  /** Overrides {@link AI_SECTION_CONTEXT_ROW_LIMIT} (tests use a small cap). */
  rowLimit?: number;
}

/** Per-row rendering context, resolved once for the whole value. */
interface SectionRowOptions {
  /** Whether rows carry a done / not done flag (see {@link usesCompletion}). */
  showCompletion: boolean;
  tagNameById?: ReadonlyMap<string, string>;
}

/**
 * Whether the value uses completion tracking at all — true when any entry or child is marked done.
 * A list nobody has ticked renders without per-row status rather than a wall of "not done".
 */
function usesCompletion(sections: SectionEntry[]): boolean {
  return sections.some(entry =>
    entry.completed === true || (entry.children ?? []).some(child => child.completed === true));
}

/** The entry's resolvable tag names, comma-joined, or null when it carries none. */
function tagNames(entry: SectionEntry, tagNameById: ReadonlyMap<string, string> | undefined): string | null {
  if (!tagNameById || !entry.tagIds || entry.tagIds.length === 0) return null;
  const names = entry.tagIds
    .map(id => tagNameById.get(id))
    .filter((name): name is string => name !== undefined);
  return names.length > 0 ? names.join(", ") : null;
}

/**
 * One entry as a single ` — `-separated line: `1.2. Name — page 3–9 — link: … — done — tags: a, b`.
 * The positional value is prefixed with its type ("page" / "timestamp") so the AI can tell a page
 * number from a timestamp; `url`/name-only entries have no positional value (the link carries it).
 */
function sectionRow(entry: SectionEntry, numbering: string, options: SectionRowOptions): string {
  const positional = sectionEntryPositional(entry);
  const link = sectionEntryLink(entry);
  const tags = tagNames(entry, options.tagNameById);
  return [
    `${numbering} ${entry.name}`,
    positional ? `${SECTION_ENTRY_TYPE_LABELS[entry.type].toLowerCase()} ${positional}` : null,
    link ? `link: ${link}` : null,
    options.showCompletion ? (entry.completed === true ? "done" : "not done") : null,
    entry.excludeFromProgress === true ? "not counted in progress" : null,
    entry.isFavorite === true ? "favorite" : null,
    tags ? `tags: ${tags}` : null,
  ].filter((part): part is string => part !== null).join(" — ");
}

/**
 * The headline above the rows: the entry counts, the completion tally, and the exhaustive flag. The
 * tally comes from `countSectionLeaves` (the shared derived-Progress rule), so it counts leaves and
 * skips progress-excluded ones — deliberately a different number from the raw entry counts beside it.
 */
function summaryLine(value: BookmarkSectionsValue, showCompletion: boolean): string {
  const count = value.sections.length;
  const children = value.sections.reduce((sum, entry) => sum + (entry.children?.length ?? 0), 0);
  const {
    total, completed,
  } = countSectionLeaves(value.sections);
  const summary = [
    count === 1 ? "1 section" : `${count} sections`,
    children > 0 ? `${children} ${children === 1 ? "sub-item" : "sub-items"}` : null,
    showCompletion ? `${completed} of ${total} done` : null,
  ].filter((part): part is string => part !== null).join(", ");
  return value.exhaustive ? `${summary} (the list below is exhaustive)` : summary;
}

/**
 * The sections value as a summary line followed by one indented row per entry (children indented a
 * further level and numbered `parent.child`). Returns `"(not set)"` when the bookmark has no value
 * or an empty list, matching the other property renderers in `propertyCurrentDisplay`.
 */
export function buildSectionsContextValue(
  value: BookmarkSectionsValue | undefined,
  options: AiSectionContextOptions = {},
): string {
  if (!value || value.sections.length === 0) return "(not set)";
  const rowOptions: SectionRowOptions = {
    showCompletion: usesCompletion(value.sections),
    tagNameById: options.tagNameById,
  };
  const rows = value.sections.flatMap((entry, index) => [
    `  ${sectionRow(entry, `${index + 1}.`, rowOptions)}`,
    ...(entry.children ?? []).map((child, childIndex) =>
      `    ${sectionRow(child, `${index + 1}.${childIndex + 1}.`, rowOptions)}`),
  ]);
  const kept = rows.slice(0, options.rowLimit ?? AI_SECTION_CONTEXT_ROW_LIMIT);
  const omitted = rows.length - kept.length;
  return [
    summaryLine(value, rowOptions.showCompletion),
    ...kept,
    ...(omitted > 0 ? [`  … ${omitted} more entries omitted`] : []),
  ].join("\n");
}
