import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Publisher, UpdatePublisherInput } from "@eesimple/types";

import { PublisherListItem } from "../components/PublisherListItem";
import { PublisherTable } from "../components/PublisherTable";
import { publisherWorkbench } from "../components/workbench/publisher";
import { useBulkDeletePublishers, usePublishers } from "../hooks/usePublishers";
import { publishersApi } from "../lib/api/taxonomies";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const PUBLISHER_ROUTE: EntityRoute = {
  kind: "publisher",
  prefix: "/taxonomies/publishers",
  slugIndex: 2,
  listLabel: "Publishers",
  singular: "Publisher",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const PUBLISHER_PALETTE: EntityPaletteConfig = {
  queryKey: ["publishers"],
  listFn: () => publishersApi.list(),
  updateFn: (id, patch) => publishersApi.update(id, patch as UpdatePublisherInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
};

export const publisherListingConfig: EntityListingConfig<Publisher> = {
  pageKey: "publishers-listing",
  useItems: usePublishers,
  matches: (publisher, query) => publisher.name.toLowerCase().includes(query),
  useBulkDelete: useBulkDeletePublishers,
  noun: ["publisher", "publishers"],
  loadingLabel: "Loading publishers…",
  entityPlural: "publishers",
  emptyMessage: (
    <p className="text-muted-foreground">
      No publishers yet. Add one above, then assign them to bookmarks.
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <PublisherListItem
      publisher={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <PublisherTable
      publishers={entities}
      selection={selection}
    />
  ),
};

/** Proof-of-concept `EntityDescriptor` — the pilot migration for issue #860. */
export const publisherDescriptor: EntityDescriptor<Publisher> = {
  kind: "publisher",
  route: PUBLISHER_ROUTE,
  palette: PUBLISHER_PALETTE,
  workbench: publisherWorkbench,
  listing: publisherListingConfig,
};
