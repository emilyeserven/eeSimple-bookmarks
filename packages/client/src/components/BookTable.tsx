import type { ListSelection } from "../lib/useListSelection";
import type { Book } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useBookColumns } from "./tables/bookColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the books listing. */
export function BookTable({
  data,
  selection,
}: {
  data: Book[];
  selection: ListSelection;
}) {
  const columns = useBookColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Book>(selection, b => b.id)] : []),
        ...columns,
      ]}
      data={data}
      sortable
      onRowClick={(book, event) =>
        rowNav(event, "book", book.id, () => {
          void navigate({
            to: "/taxonomies/books/$bookSlug",
            params: {
              bookSlug: book.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/books/$bookSlug/edit/general",
            params: {
              bookSlug: book.slug,
            },
          });
        })}
    />
  );
}
