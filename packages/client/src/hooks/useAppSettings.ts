import type {
  AiSummarizationSettings,
  BookmarkDetailImageSize,
  BookmarkDetailLayout,
  BookmarkDetailVideoSize,
  ConnectorsAppSettings,
  ImportBlacklistEntry,
  SidebarCustomizationSettings,
  SidebarOpenModifier,
  UpdateAdvancedSettingsInput,
  UpdateAiSummarizationInput,
  UpdateAutomationInput,
  UpdateConnectorsSettingsInput,
  UpdateDisplayPreferenceInput,
  UpdateHomepageContentInput,
  UpdateSidebarCustomizationInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../lib/api/settings";

const CONNECTORS_SETTINGS_KEY = ["app-settings", "connectors"] as const;
const SHORTENER_IGNORE_LIST_KEY = ["app-settings", "shortener-ignore-list"] as const;
const CUSTOM_STRIP_PARAMS_KEY = ["app-settings", "custom-strip-params"] as const;
const REDIRECT_IGNORE_LIST_KEY = ["app-settings", "redirect-ignore-list"] as const;
const IMPORT_BLACKLIST_KEY = ["app-settings", "import-blacklist"] as const;
const HOMEPAGE_CONTENT_KEY = ["app-settings", "homepage-content"] as const;
const ADVANCED_KEY = ["app-settings", "advanced"] as const;
const DATABASE_USAGE_KEY = ["app-settings", "database-usage"] as const;
const SIDEBAR_CUSTOMIZATION_KEY = ["app-settings", "sidebar-customization"] as const;
const AUTOMATION_KEY = ["app-settings", "automation"] as const;
const DISPLAY_PREFERENCES_KEY = ["app-settings", "display-preferences"] as const;
const AI_SUMMARIZATION_KEY = ["app-settings", "ai-summarization"] as const;

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
    },
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
    },
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
    },
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
    mutationFn: (entries: ImportBlacklistEntry[]) =>
      appSettingsApi.updateImportBlacklist(entries),
    onSuccess: (saved) => {
      queryClient.setQueryData(IMPORT_BLACKLIST_KEY, saved);
    },
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
  return useMutation({
    mutationFn: (input: UpdateHomepageContentInput) =>
      appSettingsApi.updateHomepageContent(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(HOMEPAGE_CONTENT_KEY, saved);
    },
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
};

const AUTOMATION_DEFAULTS = {
  autoFetchTitle: true,
  autoFetchImage: true,
  autoApplyTitleTags: false,
  sidebarOpenModifier: "alt" as SidebarOpenModifier,
};

const DISPLAY_PREFERENCE_DEFAULTS = {
  bookmarkDetailImageSize: "medium" as BookmarkDetailImageSize,
  bookmarkDetailVideoSize: "standard" as BookmarkDetailVideoSize,
  bookmarkDetailLayout: "single" as BookmarkDetailLayout,
  filtersInDrawer: false,
  filtersHidden: false,
  panelPinned: false,
  drawerUnpinnedBreakpoints: [768],
  croppedWidth: 16,
  croppedHeight: 9,
  showRomanizedByDefault: false,
  sortByRomanized: true,
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
    mutationFn: (input: UpdateAutomationInput) => appSettingsApi.updateAutomation(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(AUTOMATION_KEY, saved);
    },
  });
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

/** The modifier key that opens an item in the drawer when held during an Edit click (default "alt"). */
export function useSidebarOpenModifier(): SidebarOpenModifier {
  const {
    data,
  } = useAutomationSettings();
  return data?.sidebarOpenModifier ?? AUTOMATION_DEFAULTS.sidebarOpenModifier;
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
    mutationFn: (input: UpdateDisplayPreferenceInput) =>
      appSettingsApi.updateDisplayPreferences(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(DISPLAY_PREFERENCES_KEY, saved);
    },
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

/** Whether listing pages open filters in the right-hand drawer by default (default false). */
export function useFiltersInDrawer(): boolean {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.filtersInDrawer ?? DISPLAY_PREFERENCE_DEFAULTS.filtersInDrawer;
}

/** Whether the left filter rail is hidden on listing pages (default false). */
export function useFiltersHidden(): boolean {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.filtersHidden ?? DISPLAY_PREFERENCE_DEFAULTS.filtersHidden;
}

/** Whether the right-hand panel docks as a persistent column by default (default false). */
export function usePanelPinned(): boolean {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.panelPinned ?? DISPLAY_PREFERENCE_DEFAULTS.panelPinned;
}

/** Whether the romanized form is shown as the primary name/title by default (default false). */
export function useShowRomanizedByDefault(): boolean {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.showRomanizedByDefault ?? DISPLAY_PREFERENCE_DEFAULTS.showRomanizedByDefault;
}

/** Whether alphabetical name/title sorting uses the romanized value as the sort key (default true). */
export function useSortByRomanized(): boolean {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.sortByRomanized ?? DISPLAY_PREFERENCE_DEFAULTS.sortByRomanized;
}

/** Viewport widths (px) below which the drawer floats even when pinned (default [768]). */
export function useDrawerUnpinnedBreakpoints(): number[] {
  const {
    data,
  } = useDisplayPreferenceSettings();
  return data?.drawerUnpinnedBreakpoints ?? DISPLAY_PREFERENCE_DEFAULTS.drawerUnpinnedBreakpoints;
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
  return useMutation({
    mutationFn: (input: UpdateAiSummarizationInput) =>
      appSettingsApi.updateAiSummarization(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(AI_SUMMARIZATION_KEY, saved);
    },
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
    mutationFn: (input: UpdateConnectorsSettingsInput) =>
      appSettingsApi.updateConnectorsSettings(input),
    onSuccess: (saved: ConnectorsAppSettings) => {
      queryClient.setQueryData(CONNECTORS_SETTINGS_KEY, saved);
      // Refresh the live status badge on the Connectors page.
      void queryClient.invalidateQueries({
        queryKey: ["connectors"],
      });
    },
  });
}
