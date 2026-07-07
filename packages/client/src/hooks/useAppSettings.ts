import type {
  AiSummarizationSettings,
  AutomationSettings,
  BookmarkAddFormSettings,
  BookmarkDetailImageSize,
  BookmarkDetailLayout,
  BookmarkDetailVideoSize,
  ConnectorsAppSettings,
  ImportBlacklistEntry,
  InterfaceLanguage,
  PlaceTypeColorConfig,
  PlaceTypeDisplayConfig,
  PlaceTypeIconConfig,
  PlaceTypeLevelGroupConfig,
  PreferredLanguage,
  SidebarCustomizationSettings,
  SidebarOpenModifier,
  UpdateAdvancedSettingsInput,
  UpdateAiSummarizationInput,
  UpdateAutomationInput,
  UpdateBookmarkAddFormInput,
  UpdateBookmarkGraphInput,
  UpdateConnectorsSettingsInput,
  UpdateDisplayPreferenceInput,
  UpdateHomepageContentInput,
  UpdateSidebarCustomizationInput,
} from "@eesimple/types";

import { DEFAULT_BOOKMARK_ADD_FORM_SETTINGS, DEFAULT_BOOKMARKS_PER_PAGE, expandLevelGroupsToDisplayConfig, MAP_PIN_SCALE_DEFAULT } from "@eesimple/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useLanguages } from "./useLanguages";
import { appSettingsApi } from "../lib/api/settings";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { notifyError, notifySuccess } from "../lib/notifications";

const CONNECTORS_SETTINGS_KEY = ["app-settings", "connectors"] as const;
const BOOKMARK_ADD_FORM_KEY = ["app-settings", "bookmark-add-form"] as const;
const SHORTENER_IGNORE_LIST_KEY = ["app-settings", "shortener-ignore-list"] as const;
const CUSTOM_STRIP_PARAMS_KEY = ["app-settings", "custom-strip-params"] as const;
const REDIRECT_IGNORE_LIST_KEY = ["app-settings", "redirect-ignore-list"] as const;
const IMPORT_BLACKLIST_KEY = ["app-settings", "import-blacklist"] as const;
const HOMEPAGE_CONTENT_KEY = ["app-settings", "homepage-content"] as const;
const ADVANCED_KEY = ["app-settings", "advanced"] as const;
const DATABASE_USAGE_KEY = ["app-settings", "database-usage"] as const;
const SIDEBAR_CUSTOMIZATION_KEY = ["app-settings", "sidebar-customization"] as const;
const AUTOMATION_KEY = ["app-settings", "automation"] as const;
const BOOKMARK_GRAPH_KEY = ["app-settings", "bookmark-graph"] as const;
const LOCATION_DISPLAY_KEY = ["app-settings", "location-display"] as const;
const LOCATION_LEVEL_GROUPS_KEY = ["app-settings", "location-level-groups"] as const;
/** Stable empty fallback so `useLocationLevelGroups()` keeps a constant reference while loading. */
const EMPTY_LEVEL_GROUPS: PlaceTypeLevelGroupConfig = [];
const PLACE_TYPE_ICONS_KEY = ["app-settings", "place-type-icons"] as const;
/** Stable empty fallback so `useLocationPlaceTypeIcons()` keeps a constant reference while loading. */
const EMPTY_PLACE_TYPE_ICONS: PlaceTypeIconConfig = {};
const PLACE_TYPE_COLORS_KEY = ["app-settings", "place-type-colors"] as const;
/** Stable empty fallback so `useLocationPlaceTypeColors()` keeps a constant reference while loading. */
const EMPTY_PLACE_TYPE_COLORS: PlaceTypeColorConfig = {};
const DISPLAY_PREFERENCES_KEY = ["app-settings", "display-preferences"] as const;
const AI_SUMMARIZATION_KEY = ["app-settings", "ai-summarization"] as const;

/**
 * Variables for a mutation shared by many differently-worded call sites: each call supplies its own
 * toast text rather than the hook flattening every field into one generic "Updated <label>" message.
 */
interface ToastedMutationVars<TInput> {
  input: TInput;
  successMessage: string;
  errorMessage?: string;
}

/** The generic URL-shortener ignore list (e.g. bit.ly) used to nudge for un-expandable links. */
export function useShortenerIgnoreList() {
  return useQuery({
    queryKey: SHORTENER_IGNORE_LIST_KEY,
    queryFn: appSettingsApi.getShortenerIgnoreList,
  });
}

export function useUpdateShortenerIgnoreList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (domains: string[]) => appSettingsApi.updateShortenerIgnoreList(domains),
    onSuccess: (saved) => {
      queryClient.setQueryData(SHORTENER_IGNORE_LIST_KEY, saved);
      notifyFieldSaved("Shortener ignore list");
    },
    onError: () => notifyFieldSaveError("Shortener ignore list"),
  });
}

/** User-defined query params to strip in addition to the built-in TRACKING_PARAMS. */
export function useCustomStripParams() {
  return useQuery({
    queryKey: CUSTOM_STRIP_PARAMS_KEY,
    queryFn: appSettingsApi.getCustomStripParams,
  });
}

export function useUpdateCustomStripParams() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: string[]) => appSettingsApi.updateCustomStripParams(params),
    onSuccess: (saved) => {
      queryClient.setQueryData(CUSTOM_STRIP_PARAMS_KEY, saved);
      notifyFieldSaved("Custom strip parameters");
    },
    onError: () => notifyFieldSaveError("Custom strip parameters"),
  });
}

/** Domains whose redirect chains should never be followed when scanning a bookmark URL. */
export function useRedirectIgnoreList() {
  return useQuery({
    queryKey: REDIRECT_IGNORE_LIST_KEY,
    queryFn: appSettingsApi.getRedirectIgnoreList,
  });
}

export function useUpdateRedirectIgnoreList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (domains: string[]) => appSettingsApi.updateRedirectIgnoreList(domains),
    onSuccess: (saved) => {
      queryClient.setQueryData(REDIRECT_IGNORE_LIST_KEY, saved);
      notifyFieldSaved("Redirect ignore list");
    },
    onError: () => notifyFieldSaveError("Redirect ignore list"),
  });
}

/** The imports blacklist — links matching these are dropped from future imports. */
export function useImportBlacklist() {
  return useQuery({
    queryKey: IMPORT_BLACKLIST_KEY,
    queryFn: appSettingsApi.getImportBlacklist,
  });
}

export function useUpdateImportBlacklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToastedMutationVars<ImportBlacklistEntry[]>) =>
      appSettingsApi.updateImportBlacklist(vars.input),
    onSuccess: (saved, vars) => {
      queryClient.setQueryData(IMPORT_BLACKLIST_KEY, saved);
      notifySuccess(vars.successMessage);
    },
    onError: (error, vars) => notifyError(vars.errorMessage ?? error.message),
  });
}

/** Homepage content settings: the homepage text and Bookmark Quick Add configuration. */
export function useHomepageContentSettings() {
  return useQuery({
    queryKey: HOMEPAGE_CONTENT_KEY,
    queryFn: appSettingsApi.getHomepageContent,
  });
}

export function useUpdateHomepageContentSettings() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: UpdateHomepageContentInput) =>
      appSettingsApi.updateHomepageContent(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(HOMEPAGE_CONTENT_KEY, saved);
      notifySuccess(t("Homepage content saved"));
    },
    onError: error => notifyError(describeError(error)),
  });
}

/** Advanced settings: the opt-in Coolify / docs / Storybook sidebar links (persisted server-side). */
export function useAdvancedSettings() {
  return useQuery({
    queryKey: ADVANCED_KEY,
    queryFn: appSettingsApi.getAdvanced,
  });
}

export function useUpdateAdvancedSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAdvancedSettingsInput) => appSettingsApi.updateAdvanced(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(ADVANCED_KEY, saved);
    },
  });
}

/** Read-only snapshot of how much disk space each table and the whole database is using. */
export function useDatabaseUsage() {
  return useQuery({
    queryKey: DATABASE_USAGE_KEY,
    queryFn: appSettingsApi.getDatabaseUsage,
  });
}

/** Diagnostic detail for a single table, fetched lazily when a Database usage row is expanded. */
export function useDatabaseTableDetail(tableName: string | null) {
  return useQuery({
    queryKey: [...DATABASE_USAGE_KEY, tableName],
    queryFn: () => appSettingsApi.getDatabaseTableDetail(tableName as string),
    enabled: tableName !== null,
  });
}

/** Defaults that mirror the former `useUiStore` initial state, used while the query is loading. */
const SIDEBAR_CUSTOMIZATION_DEFAULTS: SidebarCustomizationSettings = {
  hiddenCategoryIds: [],
  seeMoreCategoryIds: [],
  hiddenTaxonomyItems: [],
  seeMoreTaxonomyItems: [],
  hiddenCustomizationItems: [],
  seeMoreCustomizationItems: [],
  hiddenManagementItems: [],
  hiddenSidebarGroups: [],
  hiddenConnectorLinks: [],
  seeMoreConnectorLinks: [],
};

const AUTOMATION_DEFAULTS = {
  autoFetchTitle: true,
  autoFetchImage: true,
  autoApplyTitleTags: false,
  autoApplyTitleLocations: false,
  sidebarOpenModifier: "alt" as SidebarOpenModifier,
};

const DISPLAY_PREFERENCE_DEFAULTS = {
  bookmarkDetailImageSize: "medium" as BookmarkDetailImageSize,
  bookmarkDetailVideoSize: "standard" as BookmarkDetailVideoSize,
  bookmarkDetailLayout: "single" as BookmarkDetailLayout,
  interfaceLanguage: "en" as InterfaceLanguage,
  onDemandFilters: [] as string[],
  searchBoxPinned: false,
  panelPinned: false,
  drawerUnpinnedBreakpoints: [768],
  croppedWidth: 16,
  croppedHeight: 9,
  hanScriptLanguage: "ja" as "ja" | "zh",
  secondaryLanguageId: null as string | null,
  minAreaPinThresholdKm2: 0,
  bookmarksPerPage: DEFAULT_BOOKMARKS_PER_PAGE,
  mapPinScale: MAP_PIN_SCALE_DEFAULT,
  screenshotDefaultDelayMs: 0,
  screenshotDefaultWidth: 1280,
  screenshotDefaultHeight: 720,
  screenshotDefaultScrollDistance: 0,
};

/** Sidebar-customization settings (group A): which left-sidebar items/groups are hidden. */
export function useSidebarCustomizationSettings() {
  return useQuery({
    queryKey: SIDEBAR_CUSTOMIZATION_KEY,
    queryFn: appSettingsApi.getSidebarCustomization,
  });
}

export function useUpdateSidebarCustomizationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSidebarCustomizationInput) =>
      appSettingsApi.updateSidebarCustomization(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(SIDEBAR_CUSTOMIZATION_KEY, saved);
    },
  });
}

/** The resolved sidebar-customization object, falling back to the empty defaults while loading. */
export function useSidebarVisibility(): SidebarCustomizationSettings {
  const {
    data,
  } = useSidebarCustomizationSettings();
  return data ?? SIDEBAR_CUSTOMIZATION_DEFAULTS;
}

/** Automation settings (group B): auto-fetch title/image + the open-in-drawer modifier. */
export function useAutomationSettings() {
  return useQuery({
    queryKey: AUTOMATION_KEY,
    queryFn: appSettingsApi.getAutomation,
  });
}

export function useUpdateAutomationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToastedMutationVars<UpdateAutomationInput>) =>
      appSettingsApi.updateAutomation(vars.input),
    onSuccess: (saved, vars) => {
      queryClient.setQueryData(AUTOMATION_KEY, saved);
      notifySuccess(vars.successMessage);
    },
    onError: (error, vars) => notifyError(vars.errorMessage ?? error.message),
  });
}

/** Shared by every automation-settings checkbox: current settings + a save(patch, message) that persists one field with a named toast. */
export function useAutomationSettingsForm() {
  const {
    data,
  } = useAutomationSettings();
  const update = useUpdateAutomationSettings();
  const settings = data ?? AUTOMATION_DEFAULTS;

  function save(patch: Partial<AutomationSettings>, message: string): void {
    update.mutate({
      input: {
        ...settings,
        ...patch,
      },
      successMessage: message,
    });
  }

  return {
    settings,
    save,
  };
}

/** Bookmark Graph settings: per-dimension relatedness weights + how many related cards to show. */
export function useBookmarkGraphSettings() {
  return useQuery({
    queryKey: BOOKMARK_GRAPH_KEY,
    queryFn: appSettingsApi.getBookmarkGraph,
  });
}

export function useUpdateBookmarkGraphSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToastedMutationVars<UpdateBookmarkGraphInput>) =>
      appSettingsApi.updateBookmarkGraph(vars.input),
    onSuccess: (saved, vars) => {
      queryClient.setQueryData(BOOKMARK_GRAPH_KEY, saved);
      notifySuccess(vars.successMessage);
    },
    onError: (error, vars) => notifyError(vars.errorMessage ?? error.message),
  });
}

/**
 * The per-placeType map display config (Settings → Locations + the map "Levels" overlay). A sparse
 * Record keyed by normalized placeType; an unconfigured place type uses the legacy area-or-pin
 * default (see `resolveLocationDisplay` in `@eesimple/types`).
 */
export function useLocationDisplaySettings() {
  return useQuery({
    queryKey: LOCATION_DISPLAY_KEY,
    queryFn: appSettingsApi.getLocationDisplay,
  });
}

/**
 * The named place-type level groups (Settings → Locations + the map "Levels" overlay) — the source of
 * truth the UI edits. The per-placeType config the map/sort consume is **derived** from this.
 */
export function useLocationLevelGroupsSettings() {
  return useQuery({
    queryKey: LOCATION_LEVEL_GROUPS_KEY,
    queryFn: appSettingsApi.getLocationLevelGroups,
  });
}

export function useUpdateLocationLevelGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceTypeLevelGroupConfig) =>
      appSettingsApi.updateLocationLevelGroups(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(LOCATION_LEVEL_GROUPS_KEY, saved);
    },
  });
}

/** The resolved level groups, defaulting to an empty list while loading. */
export function useLocationLevelGroups(): PlaceTypeLevelGroupConfig {
  const {
    data,
  } = useLocationLevelGroupsSettings();
  return data ?? EMPTY_LEVEL_GROUPS;
}

/**
 * The resolved per-placeType display config the map renderer and the place-type tree sort consume.
 * Derived from the named level groups (each member inherits its group's settings); falls back to the
 * legacy per-placeType config while no groups are configured.
 */
export function usePlaceTypeDisplayConfig(): PlaceTypeDisplayConfig {
  const groups = useLocationLevelGroups();
  const {
    data: legacy,
  } = useLocationDisplaySettings();
  return groups.length > 0 ? expandLevelGroupsToDisplayConfig(groups) : (legacy ?? {});
}

/**
 * The per-placeType map-pin icon overrides (Settings → Locations "Place Type Icons") — a sparse map of
 * placeType key → Lucide icon name the map renderer reads to draw a glyph inside each pin.
 */
export function usePlaceTypeIconsSettings() {
  return useQuery({
    queryKey: PLACE_TYPE_ICONS_KEY,
    queryFn: appSettingsApi.getPlaceTypeIcons,
  });
}

export function useUpdatePlaceTypeIcons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceTypeIconConfig) => appSettingsApi.updatePlaceTypeIcons(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(PLACE_TYPE_ICONS_KEY, saved);
    },
  });
}

/** The resolved per-placeType icon overrides, defaulting to an empty map while loading. */
export function useLocationPlaceTypeIcons(): PlaceTypeIconConfig {
  const {
    data,
  } = usePlaceTypeIconsSettings();
  return data ?? EMPTY_PLACE_TYPE_ICONS;
}

/**
 * The per-placeType map color overrides (Settings → Locations "Pin Style") — a sparse map of
 * placeType key → `#rrggbb` hex color the map renderer reads to override that place type's pin/area
 * color, winning over the level group's color.
 */
export function usePlaceTypeColorsSettings() {
  return useQuery({
    queryKey: PLACE_TYPE_COLORS_KEY,
    queryFn: appSettingsApi.getPlaceTypeColors,
  });
}

export function useUpdatePlaceTypeColors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceTypeColorConfig) => appSettingsApi.updatePlaceTypeColors(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(PLACE_TYPE_COLORS_KEY, saved);
    },
  });
}

/** The resolved per-placeType color overrides, defaulting to an empty map while loading. */
export function useLocationPlaceTypeColors(): PlaceTypeColorConfig {
  const {
    data,
  } = usePlaceTypeColorsSettings();
  return data ?? EMPTY_PLACE_TYPE_COLORS;
}

/** Whether blurring the bookmark URL field auto-fetches the page title (default true). */
export function useAutoFetchTitle(): boolean {
  const {
    data,
  } = useAutomationSettings();
  return data?.autoFetchTitle ?? AUTOMATION_DEFAULTS.autoFetchTitle;
}

/** Whether the Add Bookmark form auto-fetches the page image on save (default true). */
export function useAutoFetchImage(): boolean {
  const {
    data,
  } = useAutomationSettings();
  return data?.autoFetchImage ?? AUTOMATION_DEFAULTS.autoFetchImage;
}

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

const AI_SUMMARIZATION_DEFAULTS: AiSummarizationSettings = {
  aiSummarizationPrompt: "",
};

/** The stored AI summarization prompt and related settings. */
export function useAiSummarizationSettings() {
  return useQuery({
    queryKey: AI_SUMMARIZATION_KEY,
    queryFn: appSettingsApi.getAiSummarization,
  });
}

export function useUpdateAiSummarizationSettings() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: UpdateAiSummarizationInput) =>
      appSettingsApi.updateAiSummarization(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(AI_SUMMARIZATION_KEY, saved);
      notifySuccess(t("AI summarization prompt saved"));
    },
    onError: error => notifyError(describeError(error)),
  });
}

export { AI_SUMMARIZATION_DEFAULTS };

/** Hosted-metadata connector settings: endpoint, provider label, and whether an API key is stored. */
export function useConnectorsSettings() {
  return useQuery({
    queryKey: CONNECTORS_SETTINGS_KEY,
    queryFn: appSettingsApi.getConnectorsSettings,
  });
}

export function useUpdateConnectorsSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToastedMutationVars<UpdateConnectorsSettingsInput>) =>
      appSettingsApi.updateConnectorsSettings(vars.input),
    onSuccess: (saved: ConnectorsAppSettings, vars) => {
      queryClient.setQueryData(CONNECTORS_SETTINGS_KEY, saved);
      // Refresh the live status badge on the Connectors page.
      void queryClient.invalidateQueries({
        queryKey: ["connectors"],
      });
      notifyFieldSaved(vars.successMessage);
    },
    onError: (error, vars) => notifyFieldSaveError(vars.successMessage, error.message),
  });
}

/** Bookmark-add-form settings (group): field placement for the Add Bookmark form. */
export function useBookmarkAddFormSettings() {
  return useQuery({
    queryKey: BOOKMARK_ADD_FORM_KEY,
    queryFn: appSettingsApi.getBookmarkAddForm,
  });
}

export function useUpdateBookmarkAddFormSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBookmarkAddFormInput) =>
      appSettingsApi.updateBookmarkAddForm(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(BOOKMARK_ADD_FORM_KEY, saved);
    },
  });
}

/**
 * The resolved bookmark-add-form settings, falling back to
 * {@link DEFAULT_BOOKMARK_ADD_FORM_SETTINGS} while loading or on error — the create form then
 * behaves as it does today (today's Advanced-section fields stay Advanced, detail properties stay
 * hidden).
 */
export function useBookmarkAddFormConfig(): BookmarkAddFormSettings {
  const {
    data,
  } = useBookmarkAddFormSettings();
  return data ?? DEFAULT_BOOKMARK_ADD_FORM_SETTINGS;
}
