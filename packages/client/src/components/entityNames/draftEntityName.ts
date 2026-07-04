import type { EntityName, UpdateEntityNameEntry } from "@eesimple/types";

/** A single, possibly-incomplete row in the editor (ids may be empty while the user fills it in). */
export interface DraftEntityName {
  languageId: string;
  value: string;
  isPrimary: boolean;
}

/** Convert loaded names into editor drafts. */
export function draftsFromNames(names: EntityName[]): DraftEntityName[] {
  return names.map(n => ({
    languageId: n.language.id,
    value: n.value,
    isPrimary: n.isPrimary,
  }));
}

/** Keep only complete rows and shape them for the replace-all PUT. */
export function entriesFromDrafts(drafts: DraftEntityName[]): UpdateEntityNameEntry[] {
  return drafts
    .filter(d => d.languageId.length > 0 && d.value.trim().length > 0)
    .map(d => ({
      languageId: d.languageId,
      value: d.value.trim(),
      isPrimary: d.isPrimary,
    }));
}
