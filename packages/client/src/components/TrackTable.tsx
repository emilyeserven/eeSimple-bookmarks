import type { ListSelection } from "../lib/useListSelection";
import type { Track } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTrackColumns } from "./tables/trackColumns";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the tracks listing. */
export function TrackTable({
  data,
  selection,
}: {
  data: Track[];
  selection: ListSelection;
}) {
  const columns = useTrackColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Track>(selection, m => m.id)] : []),
        ...columns,
      ]}
      data={data}
      sortable
      onRowClick={(track, event) =>
        rowNav(event, "track", track.id, () => {
          void navigate({
            to: "/taxonomies/tracks/$trackSlug",
            params: {
              trackSlug: track.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/tracks/$trackSlug/edit/general",
            params: {
              trackSlug: track.slug,
            },
          });
        })}
    />
  );
}
