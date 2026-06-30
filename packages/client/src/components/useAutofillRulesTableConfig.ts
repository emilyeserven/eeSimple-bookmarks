import type { Category } from "@eesimple/types";

import { useAutofillRuleColumns } from "./tables/autofillRuleColumns";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";

/** The view-mode + column configuration for the autofill-rules listing (cards columns + table columns). */
export function useAutofillRulesTableConfig(categories: Category[]) {
  const columns = useBookmarkColumns("autofill-rules-listing");
  const viewMode = useViewMode("autofill-rules-listing");
  const ruleColumns = useAutofillRuleColumns(categories);
  return {
    columns,
    viewMode,
    ruleColumns,
  };
}
