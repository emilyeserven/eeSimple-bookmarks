import type { LanguageUsageAssociation, LanguageUsageLevel } from "@eesimple/types";

/**
 * How the Language Usage Levels overview groups its (language, level) associations: by the usage
 * level (each level expands to the languages that use it) or by the language (each language expands
 * to the levels it's used at). The "other" dimension always becomes the expandable children.
 */
export type LanguageUsageGroupMode = "level" | "language";

/** An expandable leaf under a group — always resolves a (language, level) pair for its link. */
export interface LanguageUsageLeaf {
  /** The leaf entity's id (a language id when grouping by level, a level id when grouping by language). */
  id: string;
  name: string;
  languageSlug: string;
  levelSlug: string;
  count: number;
}

/** A top-level group (a level or a language) with its expandable children and a total count. */
export interface LanguageUsageGroup {
  id: string;
  name: string;
  /** Sum of the children's association counts. */
  count: number;
  children: LanguageUsageLeaf[];
}

const byName = (a: { name: string }, b: { name: string }): number => a.name.localeCompare(b.name);

/**
 * Group associations for display. When `mode` is `"level"`, `levels` seeds the groups so that levels
 * with zero associations still appear (as empty, non-expandable cards); when `mode` is `"language"`,
 * only languages that appear in an association are shown. Callers pass associations/levels already
 * narrowed to a single kind. Groups and children are sorted by name for a stable render.
 */
export function groupLanguageUsages(
  associations: LanguageUsageAssociation[],
  mode: LanguageUsageGroupMode,
  levels: LanguageUsageLevel[] = [],
): LanguageUsageGroup[] {
  const groups = new Map<string, LanguageUsageGroup>();

  // Grouping by level, seed every level so empties still surface.
  if (mode === "level") {
    for (const level of levels) {
      groups.set(level.id, {
        id: level.id,
        name: level.name,
        count: 0,
        children: [],
      });
    }
  }

  for (const assoc of associations) {
    const groupKey = mode === "level" ? assoc.level.id : assoc.language.id;
    const groupName = mode === "level" ? assoc.level.name : assoc.language.name;
    const leafId = mode === "level" ? assoc.language.id : assoc.level.id;
    const leafName = mode === "level" ? assoc.language.name : assoc.level.name;

    let group = groups.get(groupKey);
    if (!group) {
      group = {
        id: groupKey,
        name: groupName,
        count: 0,
        children: [],
      };
      groups.set(groupKey, group);
    }
    group.count += assoc.count;
    group.children.push({
      id: leafId,
      name: leafName,
      languageSlug: assoc.language.slug,
      levelSlug: assoc.level.slug,
      count: assoc.count,
    });
  }

  const result = [...groups.values()];
  for (const group of result) group.children.sort(byName);
  result.sort(byName);
  return result;
}
