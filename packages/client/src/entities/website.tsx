import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { UpdateWebsiteInput, Website } from "@eesimple/types";

import { WebsiteBulkActions } from "../components/bulk/WebsiteBulkActions";
import { WebsiteListingControls } from "../components/WebsiteListingControls";
import { WebsiteListingDisplayExtras } from "../components/WebsiteListingDisplayExtras";
import { WebsiteListItem } from "../components/WebsiteListItem";
import { WebsiteTable } from "../components/WebsiteTable";
import { websiteWorkbench } from "../components/workbench/website";
import { useWebsiteFacetFilter, useWebsiteSortedItems } from "../hooks/useWebsiteListing";
import { useWebsites } from "../hooks/useWebsites";
import i18n from "../i18n";
import { websitesApi } from "../lib/api/taxonomies";
import { starredPaletteField } from "../lib/starredPaletteField";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const WEBSITE_ROUTE: EntityRoute = {
  kind: "website",
  prefix: "/taxonomies/websites",
  slugIndex: 2,
  listLabel: i18n.t("Websites"),
  singular: i18n.t("Website"),
  switcher: "website",
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const WEBSITE_PALETTE: EntityPaletteConfig = {
  queryKey: ["websites"],
  listFn: () => websitesApi.list(),
  updateFn: (id, patch) => websitesApi.update(id, patch as UpdateWebsiteInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
  getName: entity => (entity as Website).siteName,
  fields: [
    {
      type: "choice",
      key: "categoryId",
      label: i18n.t("Category"),
      options: "categories",
      getValue: entity => (entity as Website).category?.id ?? null,
    },
    {
      type: "choice",
      key: "mediaTypeId",
      label: i18n.t("Default Media Type"),
      options: "media-types",
      getValue: entity => (entity as Website).mediaTypeId ?? null,
    },
    starredPaletteField,
  ],
};

export const websiteListingConfig: EntityListingConfig<Website> = {
  pageKey: "websites-listing",
  useItems: useWebsites,
  matches: (website, query) =>
    website.siteName.toLowerCase().includes(query) || website.domain.toLowerCase().includes(query),
  deletableIds: items => items.filter(w => !w.builtIn).map(w => w.id),
  isSelectable: website => !website.builtIn,
  useExtraFilter: useWebsiteFacetFilter,
  useSortedItems: useWebsiteSortedItems,
  renderSearchSort: () => <WebsiteListingControls />,
  renderDisplayRowExtra: () => <WebsiteListingDisplayExtras />,
  renderBulkActions: ({
    selectedIds, onDone,
  }) => (
    <WebsiteBulkActions
      selectedIds={selectedIds}
      onDone={onDone}
    />
  ),
  loadingLabel: i18n.t("Loading websites…"),
  entityPlural: i18n.t("websites"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No websites yet. They're created automatically when you add bookmarks.")}
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <WebsiteListItem
      website={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <WebsiteTable
      websites={entities}
      selection={selection}
    />
  ),
};

/** Seventh `EntityDescriptor` migration (after Group #868, Person #872, PropertyGroup #873, Newsletter #874, RelationshipType + SavedFilter #875) — issue #860. */
export const websiteDescriptor: EntityDescriptor<Website> = {
  kind: "website",
  route: WEBSITE_ROUTE,
  palette: WEBSITE_PALETTE,
  workbench: websiteWorkbench,
  listing: websiteListingConfig,
};
