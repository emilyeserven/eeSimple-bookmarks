import type { PreferredLanguage } from "@eesimple/types";

import { useInterfaceLanguage } from "./useAppSettings";
import { useLanguages } from "./useLanguages";
import { useUiStore } from "../stores/uiStore";

/**
 * The language preference + collation locale that drive locale-aware title sorting (bookmarks, the
 * tag tree, locations). `preferredLanguage` picks which of an entity's multilingual names to sort by
 * when it has one; `locale` is the BCP-47 tag passed to `localeCompare` (so Japanese collates as `ja`).
 */
export interface TitleSortContext {
  preferredLanguage: PreferredLanguage | null;
  locale: string | undefined;
}

/**
 * Resolve the interface/display language (`en`/`ja` — both valid ISO-639-1 codes and BCP-47 tags)
 * into a {@link TitleSortContext}. This is the default sort preference everywhere; the bookmarks
 * listing layers a per-page override on top (see `useTitleSortLanguage`).
 */
export function useInterfaceTitleSort(): TitleSortContext {
  const language = useInterfaceLanguage();
  return {
    preferredLanguage: {
      isoCode: language,
    },
    locale: language,
  };
}

/** The stored per-page "sort titles by" language id (`""` = follow the display language) + its setter. */
export function useTitleSortLanguage(pageKey: string): {
  languageId: string;
  setLanguage: (languageId: string) => void;
} {
  const languageId = useUiStore(state => state.titleSortLanguage[pageKey] ?? "");
  const setTitleSortLanguage = useUiStore(state => state.setTitleSortLanguage);
  return {
    languageId,
    setLanguage: (next: string) => setTitleSortLanguage(pageKey, next),
  };
}

/**
 * The {@link TitleSortContext} for a listing page: the per-page "sort titles by" language override
 * when set (and still known), else the interface/display language. When a bookmark lacks the chosen
 * language's name, `resolveNameSortKey` falls back to its primary/base title automatically.
 */
export function usePageTitleSort(pageKey: string): TitleSortContext {
  const interfaceSort = useInterfaceTitleSort();
  const {
    languageId,
  } = useTitleSortLanguage(pageKey);
  const {
    data: languages,
  } = useLanguages();
  if (!languageId) return interfaceSort;
  const language = (languages ?? []).find(item => item.id === languageId);
  if (!language) return interfaceSort;
  return {
    preferredLanguage: {
      id: language.id,
      isoCode: language.isoCode,
    },
    locale: language.isoCode ?? undefined,
  };
}
