import type { SectionEntry, SectionEntryType } from "@eesimple/types";

/** Which tier(s) a bulk type-change applies to. */
export type SectionTypeScope = "all" | "sections" | "subsections";

/**
 * Return a copy of `entry` with its `type` set to `type`, mirroring the per-entry Select's
 * normalization: switching to a `name`-only entry drops any positional value so nothing stale
 * persists (`startValue` cleared, `endValue` removed).
 */
function retypeEntry(entry: SectionEntry, type: SectionEntryType): SectionEntry {
  if (type === "name") {
    const {
      endValue: _endValue, ...rest
    } = entry;
    return {
      ...rest,
      type,
      startValue: "",
    };
  }
  return {
    ...entry,
    type,
  };
}

/**
 * Bulk-set the entry `type` across a Sections list, immutably. `scope` selects which tiers change:
 * `"sections"` retypes only tier-1 entries, `"subsections"` only their children, `"all"` both. The
 * caller is responsible for offering only allowed types (`property.sectionsAllowedTypes`).
 */
export function applyBulkSectionType(
  sections: SectionEntry[],
  scope: SectionTypeScope,
  type: SectionEntryType,
): SectionEntry[] {
  const retypeParents = scope === "all" || scope === "sections";
  const retypeChildren = scope === "all" || scope === "subsections";
  return sections.map((entry) => {
    const base = retypeParents ? retypeEntry(entry, type) : entry;
    if (!retypeChildren || !base.children || base.children.length === 0) return base;
    return {
      ...base,
      children: base.children.map(child => retypeEntry(child, type)),
    };
  });
}
