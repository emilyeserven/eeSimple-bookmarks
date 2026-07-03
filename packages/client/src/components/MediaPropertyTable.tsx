import type { ListSelection } from "../lib/useListSelection";
import type { MediaProperty } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useMediaPropertyColumns } from "./tables/mediaPropertyColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the media-property listing. */
export function MediaPropertyTable({
  data,
  selection,
}: {
  data: MediaProperty[];
  selection: ListSelection;
}) {
  const columns = useMediaPropertyColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<MediaProperty>(selection, p => p.id)] : []),
        ...columns,
      ]}
      data={data}
      sortable
      onRowClick={(mediaProperty, event) =>
        rowNav(event, "media-property", mediaProperty.id, () => {
          void navigate({
            to: "/taxonomies/media-properties/$mediaPropertySlug",
            params: {
              mediaPropertySlug: mediaProperty.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/media-properties/$mediaPropertySlug/edit/general",
            params: {
              mediaPropertySlug: mediaProperty.slug,
            },
          });
        })}
    />
  );
}
