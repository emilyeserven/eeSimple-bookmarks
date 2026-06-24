import type {
  AdvancedSettings,
  AiSummarizationSettings,
  AutomationSettings,
  CardDisplayRule,
  CardFieldTemplate,
  CreateCardDisplayRuleInput,
  CreateCardFieldTemplateInput,
  CreateCustomAspectRatioInput,
  CreateFavoriteSettingsPageInput,
  CreateHomepageSectionInput,
  CreatePinnedSidebarItemInput,
  CreateSavedFilterInput,
  CustomAspectRatio,
  DatabaseUsageReport,
  DisplayPreferenceSettings,
  FavoriteSettingsPage,
  HomepageContentSettings,
  HomepageSection,
  HomepageSectionBookmarks,
  ImportBlacklistEntry,
  PinnedSidebarItem,
  SavedFilter,
  SidebarCustomizationSettings,
  UpdateAdvancedSettingsInput,
  UpdateAiSummarizationInput,
  UpdateAutomationInput,
  UpdateCardDisplayRuleInput,
  UpdateDisplayPreferenceInput,
  UpdateHomepageContentInput,
  UpdateHomepageSectionInput,
  UpdateSavedFilterInput,
  UpdateSidebarCustomizationInput,
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
};

export const aiSummarizationApi = {
  markSummarized: () =>
    request<{ count: number }>("/ai-summarization/mark-summarized", {
      method: "POST",
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

export const cardDisplayRulesApi = {
  ...createCrudApi<CardDisplayRule, CreateCardDisplayRuleInput, UpdateCardDisplayRuleInput>("card-display-rules"),
  reorder: (orderedIds: string[]) =>
    request<undefined>("/card-display-rules/reorder", {
      method: "PUT",
      body: JSON.stringify({
        orderedIds,
      }),
    }),
};

export const savedFiltersApi = createCrudApi<SavedFilter, CreateSavedFilterInput, UpdateSavedFilterInput>("saved-filters");

export const pinnedSidebarItemsApi = {
  list: () => request<PinnedSidebarItem[]>("/pinned-sidebar-items"),
  create: (input: CreatePinnedSidebarItemInput) =>
    request<PinnedSidebarItem>("/pinned-sidebar-items", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/pinned-sidebar-items/${id}`, {
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
