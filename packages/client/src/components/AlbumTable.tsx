import type { ListSelection } from "../lib/useListSelection";
import type { Album } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useAlbumColumns } from "./tables/albumColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the albums listing. */
export function AlbumTable({
  data,
  selection,
}: {
  data: Album[];
  selection: ListSelection;
}) {
  const columns = useAlbumColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Album>(selection, m => m.id)] : []),
        ...columns,
      ]}
      data={data}
      sortable
      onRowClick={(album, event) =>
        rowNav(event, "album", album.id, () => {
          void navigate({
            to: "/taxonomies/albums/$albumSlug",
            params: {
              albumSlug: album.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/albums/$albumSlug/edit/general",
            params: {
              albumSlug: album.slug,
            },
          });
        })}
    />
  );
}
