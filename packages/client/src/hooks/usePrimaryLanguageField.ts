import type { EntityNameOwnerType, UpdateEntityNameEntry } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { useEntityNames, useSetEntityNames } from "./useEntityNames";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

/**
 * Controls the language of an owner's main `name`/`title` field — the language chosen here is what
 * makes that field the entity's primary name (replacing the old per-row "Primary" checkbox in the
 * Names editor). Internally this is still the `entity_names` `isPrimary` row: {@link setPrimaryLanguage}
 * replaces it (or clears it) while leaving every other name untouched, and {@link syncPrimaryValue}
 * keeps that row's value in sync whenever the main Name field is edited.
 */
export function usePrimaryLanguageField(ownerType: EntityNameOwnerType, ownerId: string) {
  const {
    t,
  } = useTranslation();
  const {
    data: names = [],
  } = useEntityNames(ownerType, ownerId);
  const setNames = useSetEntityNames(ownerType, ownerId);
  const primaryLanguageId = names.find(name => name.isPrimary)?.language.id;

  /** Every current entry, with `languageId`/`value` unchanged, replacing the primary row (if any). */
  function buildEntries(languageId: string | undefined, value: string): UpdateEntityNameEntry[] {
    const others = names
      .filter(name => !name.isPrimary && name.language.id !== languageId)
      .map(name => ({
        languageId: name.language.id,
        value: name.value,
        isPrimary: false,
      }));
    if (!languageId) return others;
    return [...others, {
      languageId,
      value: value.trim(),
      isPrimary: true,
    }];
  }

  /** Set (or clear, when `languageId` is `undefined`) the primary language for `value`. */
  function setPrimaryLanguage(languageId: string | undefined, value: string): void {
    setNames.mutate(buildEntries(languageId, value), {
      onSuccess: () => notifyFieldSaved(t("Primary language")),
      onError: error => notifyFieldSaveError(t("Primary language"), describeError(error)),
    });
  }

  /** Re-sync the primary row's value after the main Name field is edited. No-ops when unset. */
  function syncPrimaryValue(value: string): void {
    if (!primaryLanguageId) return;
    setNames.mutate(buildEntries(primaryLanguageId, value));
  }

  return {
    primaryLanguageId,
    setPrimaryLanguage,
    syncPrimaryValue,
    isPending: setNames.isPending,
  };
}
