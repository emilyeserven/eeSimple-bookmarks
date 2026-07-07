import type { ListSelection } from "../lib/useListSelection";
import type { AutofillRule } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useAutofillRuleColumns } from "./tables/autofillRuleColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useCategories } from "../hooks/useCategories";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the unscoped Autofill Rules listing, with an optional selection column in bulk-select mode. */
export function AutofillRulesTable({
  rules,
  selection,
}: {
  rules: AutofillRule[];
  selection: ListSelection;
}) {
  const {
    data: categories,
  } = useCategories();
  const ruleColumns = useAutofillRuleColumns(categories ?? []);
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<AutofillRule>(selection, rule => rule.id)] : []),
        ...ruleColumns,
      ]}
      data={rules}
      sortable
      onRowClick={(rule, event) =>
        rowNav(event, () => {
          void navigate({
            to: "/autofill/$ruleSlug",
            params: {
              ruleSlug: rule.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/autofill/$ruleSlug/edit/general",
            params: {
              ruleSlug: rule.slug,
            },
          });
        })}
    />
  );
}
