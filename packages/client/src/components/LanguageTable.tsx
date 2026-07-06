import type { ListSelection } from "../lib/useListSelection";
import type { Language } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useLanguageColumns } from "./tables/languageColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the language listing, with an optional selection column in bulk-select mode. */
export function LanguageTable({
  data,
  selection,
}: {
  data: Language[];
  selection: ListSelection;
}) {
  const languageColumns = useLanguageColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode
          ? [listingSelectionColumn<Language>(selection, l => l.id, l => !l.builtIn)]
          : []),
        ...languageColumns,
      ]}
      data={data}
      sortable
      onRowClick={(language, event) =>
        rowNav(event, "language", language.id, () => {
          void navigate({
            to: "/taxonomies/languages/$languageSlug",
            params: {
              languageSlug: language.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/languages/$languageSlug/edit/general",
            params: {
              languageSlug: language.slug,
            },
          });
        })}
    />
  );
}
