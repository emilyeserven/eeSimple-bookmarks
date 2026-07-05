import type { EntityName, UpdateEntityNameEntry } from "@eesimple/types";

/**
 * A single, possibly-incomplete row in the editor (ids may be empty while the user fills it in).
 * There is no `isPrimary` flag here — the primary name's language is set via
 * `usePrimaryLanguageField`/`PrimaryLanguageField`, next to the owner's main Name field, not from
 * this repeatable "additional names" list. Callers pass only the non-primary rows in.
 */
export interface DraftEntityName {
  languageId: string;
  value: string;
}

/** Convert loaded (non-primary) names into editor drafts. */
export function draftsFromNames(names: EntityName[]): DraftEntityName[] {
  return names.map(n => ({
    languageId: n.language.id,
    value: n.value,
  }));
}

/** Keep only complete rows and shape them for the replace-all PUT. Always non-primary. */
export function entriesFromDrafts(drafts: DraftEntityName[]): UpdateEntityNameEntry[] {
  return drafts
    .filter(d => d.languageId.length > 0 && d.value.trim().length > 0)
    .map(d => ({
      languageId: d.languageId,
      value: d.value.trim(),
      isPrimary: false,
    }));
}
