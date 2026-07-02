import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { Newsletter } from "@eesimple/types";

import { NewsletterListItem } from "../components/NewsletterListItem";
import { NewsletterTable } from "../components/NewsletterTable";
import { newsletterWorkbench } from "../components/workbench/newsletter";
import { useBulkDeleteNewsletters, useNewsletters } from "../hooks/useNewsletters";
import { NEWSLETTER_PALETTE } from "../lib/entityPaletteRegistry";
import { NEWSLETTER_ROUTE } from "../lib/entityRoutes";

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
    entity, ...rest
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

/** Fourth `EntityDescriptor` migration (after Publisher #868, Author #872, PropertyGroup #873) — issue #860. */
export const newsletterDescriptor: EntityDescriptor<Newsletter> = {
  kind: "newsletter",
  route: NEWSLETTER_ROUTE,
  palette: NEWSLETTER_PALETTE,
  workbench: newsletterWorkbench,
  listing: newsletterListingConfig,
};
