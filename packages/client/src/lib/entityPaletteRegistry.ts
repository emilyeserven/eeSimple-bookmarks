import type { EntityRouteKind } from "./entityRoutes";
import type {
  Category,
  CustomProperty,
  RelationshipType,
  SavedFilter,
  Tag,
  UpdateAutofillRuleInput,
  UpdateAuthorInput,
  UpdateCardDisplayRuleInput,
  UpdateCategoryInput,
  UpdateCustomPropertyInput,
  UpdateImportRuleInput,
  UpdateLocationInput,
  UpdateMediaTypeInput,
  UpdateNewsletterInput,
  UpdatePlaceTypeInput,
  UpdatePropertyGroupInput,
  UpdatePublisherInput,
  UpdateRelationshipTypeInput,
  UpdateSavedFilterInput,
  UpdateTagInput,
  UpdateWebsiteInput,
  UpdateYouTubeChannelInput,
  Website,
  YouTubeChannel,
} from "@eesimple/types";

import { autofillApi } from "./api/autofill";
import { importRulesApi } from "./api/importRules";
import { newslettersApi } from "./api/imports";
import { cardDisplayRulesApi, savedFiltersApi } from "./api/settings";
import {
  authorsApi,
  categoriesApi,
  customPropertiesApi,
  locationsApi,
  mediaTypesApi,
  placeTypesApi,
  propertyGroupsApi,
  publishersApi,
  relationshipTypesApi,
  tagsApi,
  websitesApi,
  youtubeChannelsApi,
} from "./api/taxonomies";

/** The minimal shape the CMD+K entity context needs from any slug-routed entity. */
export interface PaletteEntity {
  id: string;
  slug?: string | null;
}

/** A boolean quick-toggle surfaced as a direct CommandItem on the entity's detail pages. */
export interface EntityBooleanField {
  type: "boolean";
  /** The `Update*Input` key PATCHed with the toggled value. */
  key: string;
  label: string;
  getValue: (entity: PaletteEntity) => boolean;
  /** When present and returning false, the toggle is hidden (e.g. built-in guard). */
  isEditable?: (entity: PaletteEntity) => boolean;
}

/** A single-select field surfaced as an "entity-choice" sub-palette (options from a flat list). */
export interface EntityChoiceField {
  type: "choice";
  /** The `Update*Input` key PATCHed with the chosen id (or `null` to clear). */
  key: string;
  label: string;
  /** Which cached flat list supplies the options. */
  options: "categories" | "media-types";
  getValue: (entity: PaletteEntity) => string | null;
}

export type EntityPaletteField = EntityBooleanField | EntityChoiceField;

/**
 * The hand-authored data-layer half of a CMD+K entity registry entry — everything that can't be
 * derived from `ENTITY_ROUTES` (which supplies route matching, labels, and view/edit paths).
 * `listFn`/`queryKey` reuse the entity's existing list query so the palette shares the app cache.
 */
export interface EntityPaletteConfig {
  queryKey: readonly string[];
  listFn: () => Promise<PaletteEntity[]>;
  updateFn: (id: string, patch: Record<string, unknown>) => Promise<unknown>;
  /** Query keys invalidated after a palette mutation (the entity's own key is always included). */
  extraInvalidateKeys?: readonly (readonly string[])[];
  /** The entity's display name (defaults to `entity.name`; e.g. websites use `siteName`). */
  getName?: (entity: PaletteEntity) => string;
  /** Extra edit-tab nav items beyond General, as `…/edit/<tab>` suffixes. */
  extraEditTabs?: readonly { label: string;
    tab: string; }[];
  /** Quick-action fields rendered as direct toggles / choice sub-palettes. */
  fields?: readonly EntityPaletteField[];
}

const BOOKMARKS_KEY = ["bookmarks"] as const;

/**
 * One entry per slug-routed entity kind. Exhaustive over `EntityRouteKind`, so adding an entity to
 * `ENTITY_ROUTES` without registering its data layer here fails `tsc` (see the
 * `cmd-k-entity-context` skill for the recipe).
 */
export const ENTITY_PALETTE_CONFIGS: Record<EntityRouteKind, EntityPaletteConfig> = {
  "category": {
    queryKey: ["categories"],
    listFn: () => categoriesApi.list(),
    updateFn: (id, patch) => categoriesApi.update(id, patch as UpdateCategoryInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
    fields: [
      {
        type: "boolean",
        key: "isHomepage",
        label: "Homepage Category",
        getValue: entity => (entity as Category).isHomepage,
      },
    ],
  },
  "tag": {
    queryKey: ["tags"],
    listFn: () => tagsApi.list(),
    updateFn: (id, patch) => tagsApi.update(id, patch as UpdateTagInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
    fields: [
      {
        type: "boolean",
        key: "editableOnCard",
        label: "Editable on Card",
        getValue: entity => (entity as Tag).editableOnCard ?? false,
      },
      {
        type: "boolean",
        key: "excludeFromBackfill",
        label: "Exclude from Backfill",
        getValue: entity => (entity as Tag).excludeFromBackfill ?? false,
      },
    ],
  },
  "website": {
    queryKey: ["websites"],
    listFn: () => websitesApi.list(),
    updateFn: (id, patch) => websitesApi.update(id, patch as UpdateWebsiteInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
    getName: entity => (entity as Website).siteName,
    fields: [
      {
        type: "choice",
        key: "categoryId",
        label: "Category",
        options: "categories",
        getValue: entity => (entity as Website).category?.id ?? null,
      },
      {
        type: "choice",
        key: "mediaTypeId",
        label: "Default Media Type",
        options: "media-types",
        getValue: entity => (entity as Website).mediaTypeId ?? null,
      },
    ],
  },
  "media-type": {
    queryKey: ["media-types"],
    listFn: () => mediaTypesApi.list(),
    updateFn: (id, patch) => mediaTypesApi.update(id, patch as UpdateMediaTypeInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
  },
  "location": {
    queryKey: ["locations"],
    listFn: () => locationsApi.list(),
    updateFn: (id, patch) => locationsApi.update(id, patch as UpdateLocationInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
  },
  "place-type": {
    queryKey: ["place-types"],
    listFn: () => placeTypesApi.list(),
    updateFn: (id, patch) => placeTypesApi.update(id, patch as UpdatePlaceTypeInput),
    extraInvalidateKeys: [["locations"]],
  },
  "youtube-channel": {
    queryKey: ["youtube-channels"],
    listFn: () => youtubeChannelsApi.list(),
    updateFn: (id, patch) => youtubeChannelsApi.update(id, patch as UpdateYouTubeChannelInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
    fields: [
      {
        type: "choice",
        key: "categoryId",
        label: "Category",
        options: "categories",
        getValue: entity => (entity as YouTubeChannel).category?.id ?? null,
      },
      {
        type: "choice",
        key: "mediaTypeId",
        label: "Default Media Type",
        options: "media-types",
        getValue: entity => (entity as YouTubeChannel).mediaTypeId ?? null,
      },
    ],
  },
  "newsletter": {
    queryKey: ["newsletters"],
    listFn: () => newslettersApi.list(),
    updateFn: (id, patch) => newslettersApi.update(id, patch as UpdateNewsletterInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
  },
  "author": {
    queryKey: ["authors"],
    listFn: () => authorsApi.list(),
    updateFn: (id, patch) => authorsApi.update(id, patch as UpdateAuthorInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
  },
  "publisher": {
    queryKey: ["publishers"],
    listFn: () => publishersApi.list(),
    updateFn: (id, patch) => publishersApi.update(id, patch as UpdatePublisherInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
  },
  "property-group": {
    queryKey: ["property-groups"],
    listFn: () => propertyGroupsApi.list(),
    updateFn: (id, patch) => propertyGroupsApi.update(id, patch as UpdatePropertyGroupInput),
    extraInvalidateKeys: [["custom-properties"]],
  },
  "relationship-type": {
    queryKey: ["relationship-types"],
    listFn: () => relationshipTypesApi.list(),
    updateFn: (id, patch) => relationshipTypesApi.update(id, patch as UpdateRelationshipTypeInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
    fields: [
      {
        type: "boolean",
        key: "directional",
        label: "Directional",
        getValue: entity => (entity as RelationshipType).directional,
        isEditable: entity => !(entity as RelationshipType).builtIn,
      },
    ],
  },
  "custom-property": {
    queryKey: ["custom-properties"],
    listFn: () => customPropertiesApi.list(),
    updateFn: (id, patch) => customPropertiesApi.update(id, patch as UpdateCustomPropertyInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
    fields: [
      {
        type: "boolean",
        key: "enabled",
        label: "Enabled",
        getValue: entity => (entity as CustomProperty).enabled,
      },
      {
        type: "boolean",
        key: "editableOnCard",
        label: "Editable on Card",
        getValue: entity => (entity as CustomProperty).editableOnCard,
      },
      {
        type: "boolean",
        key: "editableViaCmdk",
        label: "Editable via CMD+K",
        getValue: entity => (entity as CustomProperty).editableViaCmdk,
      },
      {
        type: "boolean",
        key: "enabledInInbox",
        label: "Enabled in Inbox",
        getValue: entity => (entity as CustomProperty).enabledInInbox,
      },
    ],
  },
  "autofill": {
    queryKey: ["autofill-rules"],
    listFn: () => autofillApi.list(),
    updateFn: (id, patch) => autofillApi.update(id, patch as UpdateAutofillRuleInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
    extraEditTabs: [
      {
        label: "Edit Conditions",
        tab: "conditions",
      },
      {
        label: "Edit Prefill",
        tab: "prefill",
      },
    ],
  },
  "import-rule": {
    queryKey: ["import-rules"],
    listFn: () => importRulesApi.list(),
    updateFn: (id, patch) => importRulesApi.update(id, patch as UpdateImportRuleInput),
    extraEditTabs: [
      {
        label: "Edit Conditions",
        tab: "conditions",
      },
    ],
  },
  "saved-filter": {
    queryKey: ["saved-filters"],
    listFn: () => savedFiltersApi.list(),
    updateFn: (id, patch) => savedFiltersApi.update(id, patch as UpdateSavedFilterInput),
    fields: [
      {
        type: "boolean",
        key: "viewableOnline",
        label: "Sidebar Shortcut",
        getValue: entity => (entity as SavedFilter).viewableOnline,
      },
    ],
  },
  "card-display-rule": {
    queryKey: ["card-display-rules"],
    listFn: () => cardDisplayRulesApi.list(),
    updateFn: (id, patch) => cardDisplayRulesApi.update(id, patch as UpdateCardDisplayRuleInput),
    extraEditTabs: [
      {
        label: "Edit Conditions",
        tab: "conditions",
      },
      {
        label: "Edit Display",
        tab: "display",
      },
    ],
  },
};
