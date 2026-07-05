import type { Bookmark, LanguageUsageLevel, UpdateLanguageUsageEntry } from "@eesimple/types";

import { useRef } from "react";

import { PRIMARY_LANGUAGE_LEVEL_NAME } from "./bookmarkFormSchema";
import { useSetLanguageUsages } from "../hooks/useLanguageUsages";

/**
 * Shared "attach an auto-detected primary language" logic for the bookmark form's scan/ISBN handlers.
 * There is no dedicated primary-language field anymore — it's expressed as an availability-kind
 * `language_usages` row on the level named "Primary Language" (see {@link PRIMARY_LANGUAGE_LEVEL_NAME}).
 * On an existing bookmark (edit), a detected language is merged into its usages and saved immediately;
 * on a not-yet-created bookmark (create), it's staged in `pendingLanguageUsagesRef` for the submit
 * handler to include in the create payload. No-ops entirely until a "Primary Language" level exists.
 */
export function useBookmarkPrimaryLanguage(
  bookmark: Bookmark | undefined,
  availabilityLevels: LanguageUsageLevel[] | undefined,
) {
  const primaryLanguageLevel = (availabilityLevels ?? [])
    .find(l => l.name.toLowerCase() === PRIMARY_LANGUAGE_LEVEL_NAME);
  const pendingLanguageUsagesRef = useRef<UpdateLanguageUsageEntry[]>([]);
  // Raw ISO-639-1 code the scan/ISBN detected for the site, staged across the scan→submit gap so the
  // create payload can label the primary entity_names row with it (#985). Independent of the
  // "Primary Language" level above — the primary name is derived even when no usage level exists.
  const siteLanguageCodeRef = useRef<string | null>(null);
  const setLanguageUsages = useSetLanguageUsages("bookmark", bookmark?.id ?? "");

  function hasPrimaryLanguageUsage(): boolean {
    if (!primaryLanguageLevel) return true;
    if (bookmark) return bookmark.languageUsages.some(u => u.level.id === primaryLanguageLevel.id);
    return pendingLanguageUsagesRef.current.some(u => u.usageLevelId === primaryLanguageLevel.id);
  }

  function attachPrimaryLanguageUsage(languageId: string): void {
    if (!primaryLanguageLevel) return;
    if (bookmark) {
      const entries: UpdateLanguageUsageEntry[] = bookmark.languageUsages.map(u => ({
        languageId: u.language.id,
        usageLevelId: u.level.id,
        note: u.note,
      }));
      entries.push({
        languageId,
        usageLevelId: primaryLanguageLevel.id,
      });
      setLanguageUsages.mutate(entries);
      return;
    }
    pendingLanguageUsagesRef.current = [...pendingLanguageUsagesRef.current, {
      languageId,
      usageLevelId: primaryLanguageLevel.id,
    }];
  }

  /** Stage the site's detected language code for the create payload; last write wins, `null` ignored server-side. */
  function stageDetectedSiteLanguageCode(code: string | null): void {
    siteLanguageCodeRef.current = code;
  }

  return {
    primaryLanguageLevelId: primaryLanguageLevel?.id,
    hasPrimaryLanguageUsage,
    attachPrimaryLanguageUsage,
    pendingLanguageUsagesRef,
    siteLanguageCodeRef,
    stageDetectedSiteLanguageCode,
  };
}
