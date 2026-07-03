import type { LanguageUsage, UpdateLanguageUsageEntry } from "@eesimple/types";

/** A single, possibly-incomplete row in the editor (ids may be empty while the user fills it in). */
export interface DraftLanguageUsage {
  languageId: string;
  usageLevelId: string;
  note: string;
}

/** Convert loaded usages into editor drafts. */
export function draftsFromUsages(usages: LanguageUsage[]): DraftLanguageUsage[] {
  return usages.map(u => ({
    languageId: u.language.id,
    usageLevelId: u.level.id,
    note: u.note ?? "",
  }));
}

/** Keep only complete rows and shape them for the replace-all PUT. */
export function entriesFromDrafts(drafts: DraftLanguageUsage[]): UpdateLanguageUsageEntry[] {
  return drafts
    .filter(d => d.languageId.length > 0 && d.usageLevelId.length > 0)
    .map(d => ({
      languageId: d.languageId,
      usageLevelId: d.usageLevelId,
      note: d.note.trim().length > 0 ? d.note.trim() : null,
    }));
}
