import type { ListSelection } from "../lib/useListSelection";
import type { Website } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useWebsiteColumns } from "./tables/websiteColumns";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the websites listing, with an optional selection column in bulk-select mode. */
export function WebsiteTable({
  websites,
  selection,
}: {
  websites: Website[];
  selection: ListSelection;
}) {
  const websiteColumns = useWebsiteColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Website>(selection, w => w.id, w => !w.builtIn)] : []),
        ...websiteColumns,
      ]}
      data={websites}
      sortable
      onRowClick={(website, event) =>
        rowNav(event, () => {
          void navigate({
            to: "/taxonomies/websites/$websiteSlug",
            params: {
              websiteSlug: website.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/websites/$websiteSlug/edit/general",
            params: {
              websiteSlug: website.slug,
            },
          });
        })}
    />
  );
}
