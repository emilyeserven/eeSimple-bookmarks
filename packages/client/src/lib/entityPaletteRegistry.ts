import type { EntityRouteKind } from "./entityRoutes";
import type {
  Tag,
  UpdateAutofillRuleInput,
  UpdateLocationInput,
  UpdateTagInput,
} from "@eesimple/types";

import { autofillApi } from "./api/autofill";
import {
  locationsApi,
  tagsApi,
} from "./api/taxonomies";
import { AUTHOR_PALETTE } from "../entities/author";
import { CARD_DISPLAY_RULE_PALETTE } from "../entities/cardDisplayRule";
import { CATEGORY_PALETTE } from "../entities/category";
import { IMPORT_RULE_PALETTE } from "../entities/importRule";
import { MEDIA_TYPE_PALETTE } from "../entities/mediaType";
import { NEWSLETTER_PALETTE } from "../entities/newsletter";
import { PLACE_TYPE_PALETTE } from "../entities/placeType";
import { CUSTOM_PROPERTY_PALETTE } from "../entities/property";
import { PROPERTY_GROUP_PALETTE } from "../entities/propertyGroup";
import { PUBLISHER_PALETTE } from "../entities/publisher";
import { RELATIONSHIP_TYPE_PALETTE } from "../entities/relationshipType";
import { SAVED_FILTER_PALETTE } from "../entities/savedFilter";
import { WEBSITE_PALETTE } from "../entities/website";
import { YOUTUBE_CHANNEL_PALETTE } from "../entities/youtubeChannel";

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
  "category": CATEGORY_PALETTE,
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
  "website": WEBSITE_PALETTE,
  "media-type": MEDIA_TYPE_PALETTE,
  "location": {
    queryKey: ["locations"],
    listFn: () => locationsApi.list(),
    updateFn: (id, patch) => locationsApi.update(id, patch as UpdateLocationInput),
    extraInvalidateKeys: [BOOKMARKS_KEY],
  },
  "place-type": PLACE_TYPE_PALETTE,
  "youtube-channel": YOUTUBE_CHANNEL_PALETTE,
  "newsletter": NEWSLETTER_PALETTE,
  "author": AUTHOR_PALETTE,
  "publisher": PUBLISHER_PALETTE,
  "property-group": PROPERTY_GROUP_PALETTE,
  "relationship-type": RELATIONSHIP_TYPE_PALETTE,
  "custom-property": CUSTOM_PROPERTY_PALETTE,
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
  "import-rule": IMPORT_RULE_PALETTE,
  "saved-filter": SAVED_FILTER_PALETTE,
  "card-display-rule": CARD_DISPLAY_RULE_PALETTE,
};
