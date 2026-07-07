import type { ListSelection } from "../lib/useListSelection";
import type { ImportRule } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useImportRuleColumns } from "./tables/importRuleColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the import-rules listing, with an optional selection column in bulk-select mode. */
export function ImportRuleTable({
  rules,
  selection,
}: {
  rules: ImportRule[];
  selection: ListSelection;
}) {
  const ruleColumns = useImportRuleColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<ImportRule>(selection, rule => rule.id)] : []),
        ...ruleColumns,
      ]}
      data={rules}
      sortable
      onRowClick={(rule, event) =>
        rowNav(event, () => {
          void navigate({
            to: "/import-rules/$ruleSlug",
            params: {
              ruleSlug: rule.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/import-rules/$ruleSlug/edit/general",
            params: {
              ruleSlug: rule.slug,
            },
          });
        })}
    />
  );
}
