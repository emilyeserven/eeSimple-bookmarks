import type { SectionEntry } from "@eesimple/types";

import { countSectionLeaves } from "@eesimple/types";
import { useTranslation } from "react-i18next";

/**
 * The muted "# completed, # unfinished" summary shown when a Sections block or a single section is
 * collapsed. Uses the shared {@link countSectionLeaves} rule (a childless tier-1 entry = 1 leaf; a
 * tier-1 entry with children is measured by its children), so the count never disagrees with the
 * derived-Progress feature. Callers pass the whole `sections` array (whole-block summary) or a
 * single-entry array `[entry]` (per-section summary).
 */
export function SectionsSummary({
  sections,
}: {
  sections: SectionEntry[];
}) {
  const {
    t,
  } = useTranslation();
  const {
    total, completed,
  } = countSectionLeaves(sections);
  return (
    <span className="text-xs text-muted-foreground">
      {t("{{completed}} completed, {{unfinished}} unfinished", {
        completed,
        unfinished: total - completed,
      })}
    </span>
  );
}
