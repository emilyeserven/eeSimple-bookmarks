import type { SectionEntry, SectionEntryType } from "@eesimple/types";

import { randomId } from "@/lib/utils";

/** A blank section entry (or child) with a stable id. */
export function newSectionEntry(defaultType: SectionEntryType): SectionEntry {
  return {
    id: randomId(),
    name: "",
    type: defaultType,
    startValue: "",
    endValue: undefined,
  };
}
