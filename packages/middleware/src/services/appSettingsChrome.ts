import { eq } from "drizzle-orm";
import type {
  AdvancedSettings,
  AutomationSettings,
  BookmarkGraphSettings,
  PersonSourceLabelSettings,
  SidebarCustomizationSettings,
  UpdateAdvancedSettingsInput,
  UpdateAutomationInput,
  UpdateBookmarkGraphInput,
  UpdatePersonSourceLabelInput,
  UpdateSidebarCustomizationInput,
} from "@eesimple/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { asModifier, DEFAULT_ADVANCED_SETTINGS, DEFAULT_AUTOMATION, DEFAULT_BOOKMARK_GRAPH, DEFAULT_PERSON_SOURCE_LABELS, DEFAULT_SHORTENER_IGNORE_LIST, DEFAULT_SIDEBAR_CUSTOMIZATION, resolveBookmarkGraph, resolvePersonSourceLabels, ROW_ID } from "./appSettingsShared";

/** Read the opt-in Advanced sidebar-link settings (Coolify, docs, Storybook). */
export async function getAdvancedSettings(): Promise<AdvancedSettings> {
  const [row] = await db
    .select({
      coolifyLinkEnabled: appSettings.coolifyLinkEnabled,
      coolifyUrl: appSettings.coolifyUrl,
      docsLinkEnabled: appSettings.docsLinkEnabled,
      storybookLinkEnabled: appSettings.storybookLinkEnabled,
      drizzleGatewayLinkEnabled: appSettings.drizzleGatewayLinkEnabled,
      drizzleGatewayUrl: appSettings.drizzleGatewayUrl,
      githubLinkEnabled: appSettings.githubLinkEnabled,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_ADVANCED_SETTINGS;
  return {
    coolifyLinkEnabled: row.coolifyLinkEnabled,
    coolifyUrl: row.coolifyUrl,
    docsLinkEnabled: row.docsLinkEnabled,
    storybookLinkEnabled: row.storybookLinkEnabled,
    drizzleGatewayLinkEnabled: row.drizzleGatewayLinkEnabled,
    drizzleGatewayUrl: row.drizzleGatewayUrl,
    githubLinkEnabled: row.githubLinkEnabled,
  };
}

/** Replace the Advanced sidebar-link settings, upserting the singleton. Returns the stored values. */
export async function updateAdvancedSettings(
  input: UpdateAdvancedSettingsInput,
): Promise<AdvancedSettings> {
  const next: AdvancedSettings = {
    coolifyLinkEnabled: input.coolifyLinkEnabled,
    coolifyUrl: input.coolifyUrl.trim(),
    docsLinkEnabled: input.docsLinkEnabled,
    storybookLinkEnabled: input.storybookLinkEnabled,
    drizzleGatewayLinkEnabled: input.drizzleGatewayLinkEnabled,
    drizzleGatewayUrl: input.drizzleGatewayUrl.trim(),
    githubLinkEnabled: input.githubLinkEnabled,
  };
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      ...next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: next,
    });
  return next;
}

/** Read the left-sidebar customization settings (group A). */
export async function getSidebarCustomizationSettings(): Promise<SidebarCustomizationSettings> {
  const [row] = await db
    .select({
      hiddenTaxonomyItems: appSettings.hiddenTaxonomyItems,
      seeMoreTaxonomyItems: appSettings.seeMoreTaxonomyItems,
      hiddenCustomizationItems: appSettings.hiddenCustomizationItems,
      seeMoreCustomizationItems: appSettings.seeMoreCustomizationItems,
      hiddenManagementItems: appSettings.hiddenManagementItems,
      hiddenSidebarGroups: appSettings.hiddenSidebarGroups,
      hiddenConnectorLinks: appSettings.hiddenConnectorLinks,
      seeMoreConnectorLinks: appSettings.seeMoreConnectorLinks,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_SIDEBAR_CUSTOMIZATION;
  return {
    hiddenTaxonomyItems: row.hiddenTaxonomyItems ?? [],
    seeMoreTaxonomyItems: row.seeMoreTaxonomyItems ?? [],
    hiddenCustomizationItems: row.hiddenCustomizationItems ?? [],
    seeMoreCustomizationItems: row.seeMoreCustomizationItems ?? [],
    hiddenManagementItems: row.hiddenManagementItems ?? [],
    hiddenSidebarGroups: row.hiddenSidebarGroups ?? [],
    hiddenConnectorLinks: row.hiddenConnectorLinks ?? [],
    seeMoreConnectorLinks: row.seeMoreConnectorLinks ?? [],
  };
}

/** Replace the sidebar-customization settings, upserting the singleton. Returns the stored values. */
export async function updateSidebarCustomizationSettings(
  input: UpdateSidebarCustomizationInput,
): Promise<SidebarCustomizationSettings> {
  const next: SidebarCustomizationSettings = {
    hiddenTaxonomyItems: [...input.hiddenTaxonomyItems],
    seeMoreTaxonomyItems: [...input.seeMoreTaxonomyItems],
    hiddenCustomizationItems: [...input.hiddenCustomizationItems],
    seeMoreCustomizationItems: [...input.seeMoreCustomizationItems],
    hiddenManagementItems: [...input.hiddenManagementItems],
    hiddenSidebarGroups: [...input.hiddenSidebarGroups],
    hiddenConnectorLinks: [...input.hiddenConnectorLinks],
    seeMoreConnectorLinks: [...input.seeMoreConnectorLinks],
  };
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      ...next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: next,
    });
  return next;
}

/** Read the automation/behavior settings (group B). */
export async function getAutomationSettings(): Promise<AutomationSettings> {
  const [row] = await db
    .select({
      autoFetchTitle: appSettings.autoFetchTitle,
      autoFetchImage: appSettings.autoFetchImage,
      autoApplyTitleTags: appSettings.autoApplyTitleTags,
      autoApplyTitleLocations: appSettings.autoApplyTitleLocations,
      shareBypassInbox: appSettings.shareBypassInbox,
      sidebarOpenModifier: appSettings.sidebarOpenModifier,
      defaultCategoryId: appSettings.defaultCategoryId,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_AUTOMATION;
  return {
    autoFetchTitle: row.autoFetchTitle,
    autoFetchImage: row.autoFetchImage,
    autoApplyTitleTags: row.autoApplyTitleTags,
    autoApplyTitleLocations: row.autoApplyTitleLocations ?? false,
    shareBypassInbox: row.shareBypassInbox ?? false,
    sidebarOpenModifier: asModifier(row.sidebarOpenModifier),
    defaultCategoryId: row.defaultCategoryId,
  };
}

/** Replace the automation settings, upserting the singleton. Returns the stored values. */
export async function updateAutomationSettings(
  input: UpdateAutomationInput,
): Promise<AutomationSettings> {
  const next: AutomationSettings = {
    autoFetchTitle: input.autoFetchTitle,
    autoFetchImage: input.autoFetchImage,
    autoApplyTitleTags: input.autoApplyTitleTags,
    autoApplyTitleLocations: input.autoApplyTitleLocations,
    shareBypassInbox: input.shareBypassInbox,
    sidebarOpenModifier: asModifier(input.sidebarOpenModifier),
    defaultCategoryId: input.defaultCategoryId,
  };
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      ...next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: next,
    });
  return next;
}

/** Read the Bookmark Graph relatedness settings (per-dimension weights + max count). */
export async function getBookmarkGraphSettings(): Promise<BookmarkGraphSettings> {
  const [row] = await db
    .select({
      bookmarkGraph: appSettings.bookmarkGraph,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_BOOKMARK_GRAPH;
  return resolveBookmarkGraph(row.bookmarkGraph);
}

/** Replace the Bookmark Graph settings, upserting the singleton. Returns the stored (coerced) values. */
export async function updateBookmarkGraphSettings(
  input: UpdateBookmarkGraphInput,
): Promise<BookmarkGraphSettings> {
  const next = resolveBookmarkGraph(input);
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      bookmarkGraph: next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        bookmarkGraph: next,
      },
    });
  return next;
}

/** Read the Person source-label settings (which `labeledWebsites` label counts as "website" / "biography"). */
export async function getPersonSourceLabelSettings(): Promise<PersonSourceLabelSettings> {
  const [row] = await db
    .select({
      personSourceLabels: appSettings.personSourceLabels,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_PERSON_SOURCE_LABELS;
  return resolvePersonSourceLabels(row.personSourceLabels);
}

/** Replace the Person source-label settings, upserting the singleton. Returns the stored (coerced) values. */
export async function updatePersonSourceLabelSettings(
  input: UpdatePersonSourceLabelInput,
): Promise<PersonSourceLabelSettings> {
  const next = resolvePersonSourceLabels(input);
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      personSourceLabels: next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        personSourceLabels: next,
      },
    });
  return next;
}
