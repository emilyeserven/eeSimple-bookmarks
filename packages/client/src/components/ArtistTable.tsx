import type { ListSelection } from "../lib/useListSelection";
import type { Artist } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useArtistColumns } from "./tables/artistColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the artists listing. */
export function ArtistTable({
  data,
  selection,
}: {
  data: Artist[];
  selection: ListSelection;
}) {
  const columns = useArtistColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Artist>(selection, m => m.id)] : []),
        ...columns,
      ]}
      data={data}
      sortable
      onRowClick={(artist, event) =>
        rowNav(event, "artist", artist.id, () => {
          void navigate({
            to: "/taxonomies/artists/$artistSlug",
            params: {
              artistSlug: artist.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/artists/$artistSlug/edit/general",
            params: {
              artistSlug: artist.slug,
            },
          });
        })}
    />
  );
}
