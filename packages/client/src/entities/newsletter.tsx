import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Newsletter, UpdateNewsletterInput } from "@eesimple/types";

import { NewsletterListItem } from "../components/NewsletterListItem";
import { NewsletterTable } from "../components/NewsletterTable";
import { newsletterWorkbench } from "../components/workbench/newsletter";
import { useBulkDeleteNewsletters, useNewsletters } from "../hooks/useNewsletters";
import { newslettersApi } from "../lib/api/imports";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const NEWSLETTER_ROUTE: EntityRoute = {
  kind: "newsletter",
  prefix: "/taxonomies/newsletters",
  slugIndex: 2,
  listLabel: "Imports",
  singular: "Import",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const NEWSLETTER_PALETTE: EntityPaletteConfig = {
  queryKey: ["newsletters"],
  listFn: () => newslettersApi.list(),
  updateFn: (id, patch) => newslettersApi.update(id, patch as UpdateNewsletterInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
};

export const newsletterListingConfig: EntityListingConfig<Newsletter> = {
  pageKey: "newsletters-listing",
  useItems: useNewsletters,
  matches: (newsletter, query) => newsletter.name.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteNewsletters,
  noun: ["newsletter", "newsletters"],
  loadingLabel: "Loading imports…",
  entityPlural: "imports",
  emptyMessage: (
    <p className="text-muted-foreground">
      No imports yet. Add one above, then select it when adding an import.
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <NewsletterListItem
      newsletter={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <NewsletterTable
      newsletters={entities}
      selection={selection}
    />
  ),
};

/** Fourth `EntityDescriptor` migration (after Group #868, Person #872, PropertyGroup #873) — issue #860. */
export const newsletterDescriptor: EntityDescriptor<Newsletter> = {
  kind: "newsletter",
  route: NEWSLETTER_ROUTE,
  palette: NEWSLETTER_PALETTE,
  workbench: newsletterWorkbench,
  listing: newsletterListingConfig,
};
