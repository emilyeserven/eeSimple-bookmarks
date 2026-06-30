import type { ImportBlacklistEntry, ImportBlacklistKind } from "@eesimple/types";

import { blacklistPatternsFor } from "@eesimple/types";

/** Derive a normalized blacklist entry from free text (a URL or bare host) for the chosen kind. */
export function entryFromInput(kind: ImportBlacklistKind, raw: string): ImportBlacklistEntry {
  const trimmed = raw.trim();
  try {
    const url = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const patterns = blacklistPatternsFor(url);
    if (kind === "domain") return patterns.domain;
    if (kind === "exact") return patterns.exact;
    return patterns.pathPrefix;
  }
  catch {
    return {
      kind,
      value: trimmed.toLowerCase(),
    };
  }
}
