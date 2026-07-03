import type { ListSelection } from "../lib/useListSelection";
import type { Podcast } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { usePodcastColumns } from "./tables/podcastColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the podcasts listing. */
export function PodcastTable({
  data,
  selection,
}: {
  data: Podcast[];
  selection: ListSelection;
}) {
  const columns = usePodcastColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Podcast>(selection, p => p.id)] : []),
        ...columns,
      ]}
      data={data}
      sortable
      onRowClick={(podcast, event) =>
        rowNav(event, "podcast", podcast.id, () => {
          void navigate({
            to: "/taxonomies/podcasts/$podcastSlug",
            params: {
              podcastSlug: podcast.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/podcasts/$podcastSlug/edit/general",
            params: {
              podcastSlug: podcast.slug,
            },
          });
        })}
    />
  );
}
