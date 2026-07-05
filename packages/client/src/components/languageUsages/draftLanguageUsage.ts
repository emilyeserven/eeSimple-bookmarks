import type { LanguageUsage, UpdateLanguageUsageEntry } from "@eesimple/types";

/** A single, possibly-incomplete row in the editor (ids may be empty while the user fills it in). */
export interface DraftLanguageUsage {
  languageId: string;
  usageLevelId: string;
  /** Optional translation-source id ("" = unspecified). */
  translationSourceId: string;
  note: string;
}

/** Convert loaded usages into editor drafts. */
export function draftsFromUsages(usages: LanguageUsage[]): DraftLanguageUsage[] {
  return usages.map(u => ({
    languageId: u.language.id,
    usageLevelId: u.level.id,
    translationSourceId: u.translationSource?.id ?? "",
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
      translationSourceId: d.translationSourceId.length > 0 ? d.translationSourceId : null,
      note: d.note.trim().length > 0 ? d.note.trim() : null,
    }));
}
