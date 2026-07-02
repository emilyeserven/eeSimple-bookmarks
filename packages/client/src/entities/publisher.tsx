import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { Publisher } from "@eesimple/types";

import { PublisherListItem } from "../components/PublisherListItem";
import { PublisherTable } from "../components/PublisherTable";
import { publisherWorkbench } from "../components/workbench/publisher";
import { useBulkDeletePublishers, usePublishers } from "../hooks/usePublishers";
import { PUBLISHER_PALETTE } from "../lib/entityPaletteRegistry";
import { PUBLISHER_ROUTE } from "../lib/entityRoutes";

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
    entity, ...rest
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
