import type { ListSelection } from "../lib/useListSelection";
import type { Episode } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useEpisodeColumns } from "./tables/episodeColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the episodes listing. */
export function EpisodeTable({
  data,
  selection,
}: {
  data: Episode[];
  selection: ListSelection;
}) {
  const columns = useEpisodeColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Episode>(selection, m => m.id)] : []),
        ...columns,
      ]}
      data={data}
      sortable
      onRowClick={(episode, event) =>
        rowNav(event, "episode", episode.id, () => {
          void navigate({
            to: "/taxonomies/episodes/$episodeSlug",
            params: {
              episodeSlug: episode.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/episodes/$episodeSlug/edit/general",
            params: {
              episodeSlug: episode.slug,
            },
          });
        })}
    />
  );
}
