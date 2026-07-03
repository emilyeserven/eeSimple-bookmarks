import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { UpdateWebsiteInput, Website } from "@eesimple/types";

import { WebsiteBulkActions } from "../components/bulk/WebsiteBulkActions";
import { WebsiteListItem } from "../components/WebsiteListItem";
import { WebsiteTable } from "../components/WebsiteTable";
import { websiteWorkbench } from "../components/workbench/website";
import { useWebsites } from "../hooks/useWebsites";
import { websitesApi } from "../lib/api/taxonomies";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const WEBSITE_ROUTE: EntityRoute = {
  kind: "website",
  prefix: "/taxonomies/websites",
  slugIndex: 2,
  listLabel: "Websites",
  singular: "Website",
  switcher: "website",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const WEBSITE_PALETTE: EntityPaletteConfig = {
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
};

export const websiteListingConfig: EntityListingConfig<Website> = {
  pageKey: "websites-listing",
  useItems: useWebsites,
  matches: (website, query) =>
    website.siteName.toLowerCase().includes(query) || website.domain.toLowerCase().includes(query),
  deletableIds: items => items.filter(w => !w.builtIn).map(w => w.id),
  isSelectable: website => !website.builtIn,
  renderBulkActions: ({
    selectedIds, onDone,
  }) => (
    <WebsiteBulkActions
      selectedIds={selectedIds}
      onDone={onDone}
    />
  ),
  loadingLabel: "Loading websites…",
  entityPlural: "websites",
  emptyMessage: (
    <p className="text-muted-foreground">
      No websites yet. They&apos;re created automatically when you add bookmarks.
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

/** Seventh `EntityDescriptor` migration (after Publisher #868, Person #872, PropertyGroup #873, Newsletter #874, RelationshipType + SavedFilter #875) — issue #860. */
export const websiteDescriptor: EntityDescriptor<Website> = {
  kind: "website",
  route: WEBSITE_ROUTE,
  palette: WEBSITE_PALETTE,
  workbench: websiteWorkbench,
  listing: websiteListingConfig,
};
