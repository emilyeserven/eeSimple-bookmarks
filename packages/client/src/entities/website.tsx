import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { Website } from "@eesimple/types";

import { WebsiteBulkActions } from "../components/bulk/WebsiteBulkActions";
import { WebsiteListItem } from "../components/WebsiteListItem";
import { WebsiteTable } from "../components/WebsiteTable";
import { websiteWorkbench } from "../components/workbench/website";
import { useWebsites } from "../hooks/useWebsites";
import { WEBSITE_PALETTE } from "../lib/entityPaletteRegistry";
import { WEBSITE_ROUTE } from "../lib/entityRoutes";

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
    entity, ...rest
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

/** Seventh `EntityDescriptor` migration (after Publisher #868, Author #872, PropertyGroup #873, Newsletter #874, RelationshipType + SavedFilter #875) — issue #860. */
export const websiteDescriptor: EntityDescriptor<Website> = {
  kind: "website",
  route: WEBSITE_ROUTE,
  palette: WEBSITE_PALETTE,
  workbench: websiteWorkbench,
  listing: websiteListingConfig,
};
