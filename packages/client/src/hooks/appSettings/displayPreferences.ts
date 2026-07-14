import type { ToastedMutationVars } from "./shared";
import type {
  BookmarkCardThumbnailSize,
  BookmarkDetailImageSize,
  BookmarkDetailLayout,
  BookmarkDetailVideoSize,
  BookmarkFieldSort,
  InterfaceLanguage,
  PreferredLanguage,
  UpdateDisplayPreferenceInput,
} from "@eesimple/types";

import { DEFAULT_BOOKMARKS_PER_PAGE, MAP_PIN_SCALE_DEFAULT } from "@eesimple/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../../lib/api/settings";
import { notifyError, notifySuccess } from "../../lib/notifications";
import { useLanguages } from "../useLanguages";

const DISPLAY_PREFERENCES_KEY = ["app-settings", "display-preferences"] as const;

const DISPLAY_PREFERENCE_DEFAULTS = {
  bookmarkDetailImageSize: "medium" as BookmarkDetailImageSize,
  bookmarkDetailVideoSize: "standard" as BookmarkDetailVideoSize,
  bookmarkDetailLayout: "single" as BookmarkDetailLayout,
  bookmarkCardThumbnailSize: "medium" as BookmarkCardThumbnailSize,
  interfaceLanguage: "en" as InterfaceLanguage,
  onDemandFilters: [] as string[],
  filterOrder: [] as string[],
  mobileHiddenFilters: [] as string[],
  defaultBookmarkSort: null as BookmarkFieldSort | null,
  searchBoxPinned: false,
  panelPinned: false,
  drawerUnpinnedBreakpoints: [768],
  croppedWidth: 16,
  croppedHeight: 9,
  hanScriptLanguage: "ja" as "ja" | "zh",
  secondaryLanguageId: null as string | null,
  fallbackLanguageId: null as string | null,
  minAreaPinThresholdKm2: 0,
  bookmarksPerPage: DEFAULT_BOOKMARKS_PER_PAGE,
  mapPinScale: MAP_PIN_SCALE_DEFAULT,
  screenshotDefaultDelayMs: 0,
  screenshotDefaultWidth: 1280,
  screenshotDefaultHeight: 720,
  screenshotDefaultScrollDistance: 0,
  maxImageEdge: 1200,
  imageQuality: 80,
};

/** Display/detail preferences (group C): detail media sizing, filter placement, pin, cropped ratio. */
export function useDisplayPreferenceSettings() {
  return useQuery({
    queryKey: DISPLAY_PREFERENCES_KEY,
    queryFn: appSettingsApi.getDisplayPreferences,
  });
}

export function useUpdateDisplayPreferenceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToastedMutationVars<UpdateDisplayPreferenceInput>) =>
      appSettingsApi.updateDisplayPreferences(vars.input),
    onSuccess: (saved, vars) => {
      queryClient.setQueryData(DISPLAY_PREFERENCES_KEY, saved);
      notifySuccess(vars.successMessage);
    },
    onError: (error, vars) => notifyError(vars.errorMessage ?? error.message),
  });
}

/** Bookmark detail image size (default "medium"). */
export function useBookmarkDetailImageSize(): BookmarkDetailImageSize {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.bookmarkDetailImageSize ?? DISPLAY_PREFERENCE_DEFAULTS.bookmarkDetailImageSize;
}

/** Bookmark detail video size (default "standard"). */
export function useBookmarkDetailVideoSize(): BookmarkDetailVideoSize {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.bookmarkDetailVideoSize ?? DISPLAY_PREFERENCE_DEFAULTS.bookmarkDetailVideoSize;
}

/** Bookmark detail layout (default "single"). */
export function useBookmarkDetailLayout(): BookmarkDetailLayout {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.bookmarkDetailLayout ?? DISPLAY_PREFERENCE_DEFAULTS.bookmarkDetailLayout;
}

/** Bookmark card thumbnail size, image-left/row card layout (default "medium"). */
export function useBookmarkCardThumbnailSize(): BookmarkCardThumbnailSize {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.bookmarkCardThumbnailSize ?? DISPLAY_PREFERENCE_DEFAULTS.bookmarkCardThumbnailSize;
}

/** Interface language driving i18next + Intl formatting (default "en"). */
export function useInterfaceLanguage(): InterfaceLanguage {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.interfaceLanguage ?? DISPLAY_PREFERENCE_DEFAULTS.interfaceLanguage;
}

/**
 * The language a multilingual entity's secondary display name (breadcrumbs, etc.) is drawn from —
 * `null` when unset (auto: an English-tagged name, else the entity's first other name).
 */
export function useSecondaryDisplayLanguage(): PreferredLanguage | null {
  const {
    data,
  } = useDisplayPreferenceSettings();
  const {
    data: languages,
  } = useLanguages();
  const id = data?.secondaryLanguageId ?? DISPLAY_PREFERENCE_DEFAULTS.secondaryLanguageId;
  if (!id) return null;
  const language = languages?.find(l => l.id === id);
  return language
    ? {
      id: language.id,
      isoCode: language.isoCode,
    }
    : null;
}

/**
 * Resolve a stored `fallbackLanguageId` (nullable) against the known languages into a
 * {@link PreferredLanguage}. Unlike the secondary-language resolution this never yields `null`:
 * an unset id — or an id that no longer resolves to a language — falls back to English
 * (`{ isoCode: "en" }`), the historical hardcoded behavior, so the default is byte-identical. Pure
 * so it can be unit-tested without react-query.
 */
export function resolveFallbackDisplayLanguage(
  id: string | null | undefined,
  languages: { id: string;
    isoCode: string | null; }[] | undefined,
): PreferredLanguage {
  if (!id) return {
    isoCode: "en",
  };
  const language = languages?.find(l => l.id === id);
  return language
    ? {
      id: language.id,
      isoCode: language.isoCode,
    }
    : {
      isoCode: "en",
    };
}

/**
 * The language used as the de-emphasized fallback secondary display name / sort fallback when no
 * preferred/secondary-language name matches. Unlike {@link useSecondaryDisplayLanguage} this never
 * returns `null`: when unset it resolves to English (`{ isoCode: "en" }`), the historical hardcoded
 * behavior, so the default is byte-identical.
 */
export function useFallbackDisplayLanguage(): PreferredLanguage {
  const {
    data,
  } = useDisplayPreferenceSettings();
  const {
    data: languages,
  } = useLanguages();
  return resolveFallbackDisplayLanguage(
    data?.fallbackLanguageId ?? DISPLAY_PREFERENCE_DEFAULTS.fallbackLanguageId,
    languages,
  );
}

/** How many bookmarks to show per listing page (default 25). */
export function useBookmarksPerPage(): number {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.bookmarksPerPage ?? DISPLAY_PREFERENCE_DEFAULTS.bookmarksPerPage;
}

/**
 * Whether the listing-page search box floats (sticks to the top of the viewport while the list
 * scrolls). Toggled from the box's pin button; `??` only covers the loading state.
 */
export function useSearchBoxPinned(): boolean {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.searchBoxPinned ?? DISPLAY_PREFERENCE_DEFAULTS.searchBoxPinned;
}

/** Filter facet keys / custom-property ids hidden from the rail until added on demand (default []). */
export function useOnDemandFilters(): string[] {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.onDemandFilters ?? DISPLAY_PREFERENCE_DEFAULTS.onDemandFilters;
}

/** User-defined order of filter keys in the filter rail (empty = default order). */
export function useFilterOrder(): string[] {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.filterOrder ?? DISPLAY_PREFERENCE_DEFAULTS.filterOrder;
}

/** Filter keys hidden by default on small (mobile) screens (behave as on-demand there). */
export function useMobileHiddenFilters(): string[] {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.mobileHiddenFilters ?? DISPLAY_PREFERENCE_DEFAULTS.mobileHiddenFilters;
}

/**
 * The user's configured default bookmark-listing sort — applied when a listing has no explicit
 * `sort` in the URL (null = today's `createdAt DESC` fallback).
 */
export function useDefaultBookmarkSort(): BookmarkFieldSort | null {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.defaultBookmarkSort ?? DISPLAY_PREFERENCE_DEFAULTS.defaultBookmarkSort;
}

/** Minimum boundary area (km²) for an "area"-mode location to still render as a polygon (default 0 = off). */
export function useMinAreaPinThresholdKm2(): number {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.minAreaPinThresholdKm2 ?? DISPLAY_PREFERENCE_DEFAULTS.minAreaPinThresholdKm2;
}

/** Scale factor applied to every rendered map pin's size (default 1 = 100%). */
export function useMapPinScale(): number {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.mapPinScale ?? DISPLAY_PREFERENCE_DEFAULTS.mapPinScale;
}

/** Width component of the built-in "Cropped" aspect ratio (default 16). */
export function useCroppedWidth(): number {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.croppedWidth ?? DISPLAY_PREFERENCE_DEFAULTS.croppedWidth;
}

/** Height component of the built-in "Cropped" aspect ratio (default 9). */
export function useCroppedHeight(): number {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.croppedHeight ?? DISPLAY_PREFERENCE_DEFAULTS.croppedHeight;
}
