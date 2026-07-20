import type {
  AdvancedSettings,
  AiAutotagApplyInput,
  AiAutotagApplyResult,
  AiAutotagSettings,
  AiSummarizationSettings,
  AiSummaryApplyInput,
  AiSummaryApplyResult,
  AiSummaryQueueItem,
  AiUntaggedBookmark,
  AutomationSettings,
  BookmarkAddFormSettings,
  BookmarkAiUpdateSettings,
  BookmarkGraphSettings,
  CardDisplayConfig,
  CardFieldTemplate,
  ConnectorsAppSettings,
  CreateCardFieldTemplateInput,
  CreateCustomAspectRatioInput,
  CreateFavoriteSettingsPageInput,
  CreateHomepageSectionInput,
  CreateParseTemplateInput,
  CreatePinnedSectionInput,
  CreatePinnedSidebarItemInput,
  CreateSavedFilterInput,
  CustomAspectRatio,
  DatabaseTableDetail,
  DatabaseUsageReport,
  DisplayPreferenceSettings,
  EntityLayout,
  EntityLayoutRecord,
  FavoriteSettingsPage,
  HomepageContentSettings,
  HomepageSection,
  HomepageSectionBookmarks,
  ImportBlacklistEntry,
  LayoutableEntityKind,
  ParseTemplate,
  PersonSourceLabelSettings,
  PinnedSection,
  PinnedSidebarItem,
  PlaceTypeColorConfig,
  PlaceTypeDisplayConfig,
  PlaceTypeIconConfig,
  PlaceTypeLevelGroupConfig,
  SavedFilter,
  ScratchpadSettings,
  SidebarCustomizationSettings,
  TagReparentSettings,
  UpdateAdvancedSettingsInput,
  UpdateAiAutotagInput,
  UpdateAiSummarizationInput,
  UpdateAutomationInput,
  UpdateBookmarkAddFormInput,
  UpdateBookmarkAiUpdateInput,
  UpdateBookmarkGraphInput,
  UpdateConnectorsSettingsInput,
  UpdateDisplayPreferenceInput,
  UpdateHomepageContentInput,
  UpdateHomepageSectionInput,
  UpdateParseTemplateInput,
  UpdatePersonSourceLabelInput,
  UpdatePinnedSectionInput,
  UpdatePinnedSidebarItemInput,
  UpdateSavedFilterInput,
  UpdateScratchpadInput,
  UpdateSidebarCustomizationInput,
  UpdateTagReparentInput,
} from "@eesimple/types";

import { createCrudApi, request } from "./client";

export const appSettingsApi = {
  getShortenerIgnoreList: () => request<string[]>("/app-settings/shortener-ignore-list"),
  updateShortenerIgnoreList: (domains: string[]) =>
    request<string[]>("/app-settings/shortener-ignore-list", {
      method: "PUT",
      body: JSON.stringify({
        domains,
      }),
    }),
  getCustomStripParams: () => request<string[]>("/app-settings/custom-strip-params"),
  updateCustomStripParams: (params: string[]) =>
    request<string[]>("/app-settings/custom-strip-params", {
      method: "PUT",
      body: JSON.stringify({
        params,
      }),
    }),
  getRedirectIgnoreList: () => request<string[]>("/app-settings/redirect-ignore-list"),
  updateRedirectIgnoreList: (domains: string[]) =>
    request<string[]>("/app-settings/redirect-ignore-list", {
      method: "PUT",
      body: JSON.stringify({
        domains,
      }),
    }),
  getImportBlacklist: () =>
    request<ImportBlacklistEntry[]>("/app-settings/import-blacklist"),
  updateImportBlacklist: (entries: ImportBlacklistEntry[]) =>
    request<ImportBlacklistEntry[]>("/app-settings/import-blacklist", {
      method: "PUT",
      body: JSON.stringify({
        entries,
      }),
    }),
  getHomepageContent: () =>
    request<HomepageContentSettings>("/app-settings/homepage-content"),
  updateHomepageContent: (input: UpdateHomepageContentInput) =>
    request<HomepageContentSettings>("/app-settings/homepage-content", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getAdvanced: () => request<AdvancedSettings>("/app-settings/advanced"),
  updateAdvanced: (input: UpdateAdvancedSettingsInput) =>
    request<AdvancedSettings>("/app-settings/advanced", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getDatabaseUsage: () => request<DatabaseUsageReport>("/app-settings/database-usage"),
  getDatabaseTableDetail: (tableName: string) =>
    request<DatabaseTableDetail>(`/app-settings/database-usage/${encodeURIComponent(tableName)}`),
  getSidebarCustomization: () =>
    request<SidebarCustomizationSettings>("/app-settings/sidebar-customization"),
  updateSidebarCustomization: (input: UpdateSidebarCustomizationInput) =>
    request<SidebarCustomizationSettings>("/app-settings/sidebar-customization", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getAutomation: () => request<AutomationSettings>("/app-settings/automation"),
  updateAutomation: (input: UpdateAutomationInput) =>
    request<AutomationSettings>("/app-settings/automation", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getBookmarkGraph: () => request<BookmarkGraphSettings>("/app-settings/bookmark-graph"),
  updateBookmarkGraph: (input: UpdateBookmarkGraphInput) =>
    request<BookmarkGraphSettings>("/app-settings/bookmark-graph", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getPersonSourceLabels: () =>
    request<PersonSourceLabelSettings>("/app-settings/person-source-labels"),
  updatePersonSourceLabels: (input: UpdatePersonSourceLabelInput) =>
    request<PersonSourceLabelSettings>("/app-settings/person-source-labels", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getLocationDisplay: () =>
    request<PlaceTypeDisplayConfig>("/app-settings/location-display"),
  updateLocationDisplay: (input: PlaceTypeDisplayConfig) =>
    request<PlaceTypeDisplayConfig>("/app-settings/location-display", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getLocationLevelGroups: () =>
    request<PlaceTypeLevelGroupConfig>("/app-settings/location-level-groups"),
  updateLocationLevelGroups: (input: PlaceTypeLevelGroupConfig) =>
    request<PlaceTypeLevelGroupConfig>("/app-settings/location-level-groups", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getPlaceTypeIcons: () =>
    request<PlaceTypeIconConfig>("/app-settings/place-type-icons"),
  updatePlaceTypeIcons: (input: PlaceTypeIconConfig) =>
    request<PlaceTypeIconConfig>("/app-settings/place-type-icons", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getPlaceTypeColors: () =>
    request<PlaceTypeColorConfig>("/app-settings/place-type-colors"),
  updatePlaceTypeColors: (input: PlaceTypeColorConfig) =>
    request<PlaceTypeColorConfig>("/app-settings/place-type-colors", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getDisplayPreferences: () =>
    request<DisplayPreferenceSettings>("/app-settings/display-preferences"),
  updateDisplayPreferences: (input: UpdateDisplayPreferenceInput) =>
    request<DisplayPreferenceSettings>("/app-settings/display-preferences", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getAiSummarization: () =>
    request<AiSummarizationSettings>("/app-settings/ai-summarization"),
  updateAiSummarization: (input: UpdateAiSummarizationInput) =>
    request<AiSummarizationSettings>("/app-settings/ai-summarization", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getScratchpad: () =>
    request<ScratchpadSettings>("/app-settings/scratchpad"),
  updateScratchpad: (input: UpdateScratchpadInput) =>
    request<ScratchpadSettings>("/app-settings/scratchpad", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getAiAutotag: () =>
    request<AiAutotagSettings>("/app-settings/ai-autotag"),
  updateAiAutotag: (input: UpdateAiAutotagInput) =>
    request<AiAutotagSettings>("/app-settings/ai-autotag", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getTagReparent: () =>
    request<TagReparentSettings>("/app-settings/tag-reparent"),
  updateTagReparent: (input: UpdateTagReparentInput) =>
    request<TagReparentSettings>("/app-settings/tag-reparent", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getBookmarkAiUpdate: () =>
    request<BookmarkAiUpdateSettings>("/app-settings/bookmark-ai-update"),
  updateBookmarkAiUpdate: (input: UpdateBookmarkAiUpdateInput) =>
    request<BookmarkAiUpdateSettings>("/app-settings/bookmark-ai-update", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getConnectorsSettings: () =>
    request<ConnectorsAppSettings>("/app-settings/connectors"),
  updateConnectorsSettings: (input: UpdateConnectorsSettingsInput) =>
    request<ConnectorsAppSettings>("/app-settings/connectors", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getBookmarkAddForm: () =>
    request<BookmarkAddFormSettings>("/app-settings/bookmark-add-form"),
  updateBookmarkAddForm: (input: UpdateBookmarkAddFormInput) =>
    request<BookmarkAddFormSettings>("/app-settings/bookmark-add-form", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
};

export const aiSummarizationApi = {
  getQueue: () => request<AiSummaryQueueItem[]>("/ai-summarization/queue"),
  markSummarized: () =>
    request<{ count: number }>("/ai-summarization/mark-summarized", {
      method: "POST",
    }),
  apply: (input: AiSummaryApplyInput) =>
    request<AiSummaryApplyResult>("/ai-summarization/apply", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

export const aiAutotagApi = {
  getUntagged: (limit: number) =>
    request<AiUntaggedBookmark[]>(`/ai-autotag/untagged?limit=${limit}`),
  apply: (input: AiAutotagApplyInput) =>
    request<AiAutotagApplyResult>("/ai-autotag/apply", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

export const homepageSectionsApi = {
  ...createCrudApi<HomepageSection, CreateHomepageSectionInput, UpdateHomepageSectionInput>("homepage-sections"),
  reorder: (orderedIds: string[]) =>
    request<undefined>("/homepage-sections/reorder", {
      method: "PUT",
      body: JSON.stringify({
        orderedIds,
      }),
    }),
  withBookmarks: () => request<HomepageSectionBookmarks[]>("/bookmarks/homepage-sections"),
};

export const cardDisplayConfigApi = {
  get: () => request<CardDisplayConfig>("/card-display"),
  update: (patch: Partial<CardDisplayConfig>) =>
    request<CardDisplayConfig>("/card-display", {
      method: "PUT",
      body: JSON.stringify(patch),
    }),
};

export const entityLayoutsApi = {
  list: () => request<EntityLayoutRecord[]>("/entity-layouts"),
  save: (kind: LayoutableEntityKind, layout: EntityLayout) =>
    request<EntityLayoutRecord>(`/entity-layouts/${kind}`, {
      method: "PUT",
      body: JSON.stringify({
        layout,
      }),
    }),
  reset: (kind: LayoutableEntityKind) =>
    request<undefined>(`/entity-layouts/${kind}`, {
      method: "DELETE",
    }),
  /** Clear a corrupted stored layout by its raw kind string (may be a non-enum `taxonomy:<id>` key). */
  clearInvalid: (kind: string) =>
    request<undefined>(`/entity-layouts/invalid/${encodeURIComponent(kind)}`, {
      method: "DELETE",
    }),
};

export const savedFiltersApi = createCrudApi<SavedFilter, CreateSavedFilterInput, UpdateSavedFilterInput>("saved-filters");

export const parseTemplatesApi = createCrudApi<ParseTemplate, CreateParseTemplateInput, UpdateParseTemplateInput>("parse-templates");

export const pinnedSidebarItemsApi = {
  list: () => request<PinnedSidebarItem[]>("/pinned-sidebar-items"),
  create: (input: CreatePinnedSidebarItemInput) =>
    request<PinnedSidebarItem>("/pinned-sidebar-items", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdatePinnedSidebarItemInput) =>
    request<PinnedSidebarItem>(`/pinned-sidebar-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  reorder: (orderedIds: string[]) =>
    request<undefined>("/pinned-sidebar-items/reorder", {
      method: "PUT",
      body: JSON.stringify({
        orderedIds,
      }),
    }),
  remove: (id: string) => request<undefined>(`/pinned-sidebar-items/${id}`, {
    method: "DELETE",
  }),
};

export const pinnedSectionsApi = {
  list: () => request<PinnedSection[]>("/pinned-sections"),
  create: (input: CreatePinnedSectionInput) =>
    request<PinnedSection>("/pinned-sections", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdatePinnedSectionInput) =>
    request<PinnedSection>(`/pinned-sections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  reorder: (orderedIds: string[]) =>
    request<undefined>("/pinned-sections/reorder", {
      method: "PUT",
      body: JSON.stringify({
        orderedIds,
      }),
    }),
  remove: (id: string) => request<undefined>(`/pinned-sections/${id}`, {
    method: "DELETE",
  }),
};

export const favoriteSettingsPagesApi = {
  list: () => request<FavoriteSettingsPage[]>("/favorite-settings-pages"),
  create: (input: CreateFavoriteSettingsPageInput) =>
    request<FavoriteSettingsPage>("/favorite-settings-pages", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/favorite-settings-pages/${id}`, {
    method: "DELETE",
  }),
};

export const customAspectRatiosApi = {
  list: () => request<CustomAspectRatio[]>("/custom-aspect-ratios"),
  create: (input: CreateCustomAspectRatioInput) =>
    request<CustomAspectRatio>("/custom-aspect-ratios", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/custom-aspect-ratios/${id}`, {
    method: "DELETE",
  }),
};

export const cardFieldTemplatesApi = {
  list: () => request<CardFieldTemplate[]>("/card-field-templates"),
  create: (input: CreateCardFieldTemplateInput) =>
    request<CardFieldTemplate>("/card-field-templates", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/card-field-templates/${id}`, {
    method: "DELETE",
  }),
};
