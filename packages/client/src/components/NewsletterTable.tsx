import type { ListSelection } from "../lib/useListSelection";
import type { Newsletter } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useNewsletterColumns } from "./tables/newsletterColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the newsletters listing, with an optional selection column in bulk-select mode. */
export function NewsletterTable({
  newsletters,
  selection,
}: {
  newsletters: Newsletter[];
  selection: ListSelection;
}) {
  const newsletterColumns = useNewsletterColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Newsletter>(selection, n => n.id)] : []),
        ...newsletterColumns,
      ]}
      data={newsletters}
      sortable
      onRowClick={(newsletter, event) =>
        rowNav(event, () => {
          void navigate({
            to: "/taxonomies/newsletters/$newsletterSlug",
            params: {
              newsletterSlug: newsletter.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/newsletters/$newsletterSlug/edit",
            params: {
              newsletterSlug: newsletter.slug,
            },
          });
        })}
    />
  );
}
