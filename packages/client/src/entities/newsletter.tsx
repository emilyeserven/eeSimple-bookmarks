import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Newsletter, UpdateNewsletterInput } from "@eesimple/types";

import { NewsletterListItem } from "../components/NewsletterListItem";
import { NewsletterTable } from "../components/NewsletterTable";
import { newsletterWorkbench } from "../components/workbench/newsletter";
import { useBulkDeleteNewsletters, useNewsletters } from "../hooks/useNewsletters";
import i18n from "../i18n";
import { newslettersApi } from "../lib/api/imports";
import { starredPaletteField } from "../lib/starredPaletteField";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const NEWSLETTER_ROUTE: EntityRoute = {
  kind: "newsletter",
  prefix: "/taxonomies/newsletters",
  slugIndex: 2,
  listLabel: i18n.t("Imports"),
  singular: i18n.t("Import"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const NEWSLETTER_PALETTE: EntityPaletteConfig = {
  queryKey: ["newsletters"],
  listFn: () => newslettersApi.list(),
  updateFn: (id, patch) => newslettersApi.update(id, patch as UpdateNewsletterInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
  fields: [starredPaletteField],
};

export const newsletterListingConfig: EntityListingConfig<Newsletter> = {
  pageKey: "newsletters-listing",
  useItems: useNewsletters,
  matches: (newsletter, query) => newsletter.name.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteNewsletters,
  noun: [i18n.t("newsletter"), i18n.t("newsletters")],
  loadingLabel: i18n.t("Loading imports…"),
  entityPlural: i18n.t("imports"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No imports yet. Add one above, then select it when adding an import.")}
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
