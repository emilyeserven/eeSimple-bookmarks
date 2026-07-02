import type { ListSelection } from "../lib/useListSelection";
import type { Author } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useAuthorColumns } from "./tables/authorColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the authors listing, with an optional selection column in bulk-select mode. */
export function AuthorTable({
  authors,
  selection,
}: {
  authors: Author[];
  selection: ListSelection;
}) {
  const authorColumns = useAuthorColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Author>(selection, a => a.id)] : []),
        ...authorColumns,
      ]}
      data={authors}
      sortable
      onRowClick={(author, event) =>
        rowNav(event, "author", author.id, () => {
          void navigate({
            to: "/taxonomies/authors/$authorSlug",
            params: {
              authorSlug: author.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/authors/$authorSlug/edit/general",
            params: {
              authorSlug: author.slug,
            },
          });
        })}
    />
  );
}
