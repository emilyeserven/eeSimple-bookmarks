import type { ListSelection } from "../lib/useListSelection";
import type { Category } from "@eesimple/types";

import { useCategoryColumns } from "./tables/categoryColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

interface CategoriesTableProps {
  data: Category[];
  selection: ListSelection;
  onView: (slug: string) => void;
  onEdit: (slug: string) => void;
}

/** The table (data-grid) view of the Categories listing: a sortable `DataTable` with the optional
 * bulk-select column and click-to-open / modifier-click-to-edit row navigation. */
export function CategoriesTable({
  data, selection, onView, onEdit,
}: CategoriesTableProps) {
  const categoryColumns = useCategoryColumns();
  const rowNav = useTableRowNav();

  return (
    <DataTable
      columns={[
        ...(selection.mode
          ? [listingSelectionColumn<Category>(selection, c => c.id, c => !c.builtIn)]
          : []),
        ...categoryColumns,
      ]}
      data={data}
      sortable
      onRowClick={(category, event) =>
        rowNav(event, "category", category.id, () => onView(category.slug), () => onEdit(category.slug))}
    />
  );
}
