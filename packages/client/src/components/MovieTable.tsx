import type { ListSelection } from "../lib/useListSelection";
import type { Movie } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useMovieColumns } from "./tables/movieColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the movies listing. */
export function MovieTable({
  data,
  selection,
}: {
  data: Movie[];
  selection: ListSelection;
}) {
  const columns = useMovieColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Movie>(selection, m => m.id)] : []),
        ...columns,
      ]}
      data={data}
      sortable
      onRowClick={(movie, event) =>
        rowNav(event, "movie", movie.id, () => {
          void navigate({
            to: "/taxonomies/movies/$movieSlug",
            params: {
              movieSlug: movie.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/movies/$movieSlug/edit/general",
            params: {
              movieSlug: movie.slug,
            },
          });
        })}
    />
  );
}
