import type { ListSelection } from "../lib/useListSelection";
import type { TvShow } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTvShowColumns } from "./tables/tvShowColumns";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the TV-shows listing. */
export function TvShowTable({
  data,
  selection,
}: {
  data: TvShow[];
  selection: ListSelection;
}) {
  const columns = useTvShowColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<TvShow>(selection, s => s.id)] : []),
        ...columns,
      ]}
      data={data}
      sortable
      onRowClick={(show, event) =>
        rowNav(event, "tv-show", show.id, () => {
          void navigate({
            to: "/taxonomies/tv-shows/$tvShowSlug",
            params: {
              tvShowSlug: show.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/tv-shows/$tvShowSlug/edit/general",
            params: {
              tvShowSlug: show.slug,
            },
          });
        })}
    />
  );
}
