import { useMemo } from "react";

import { useNavigate } from "@tanstack/react-router";

import { ImportRuleListItem } from "./ImportRuleListItem";
import { useImportRuleColumns } from "./tables/importRuleColumns";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useImportRules } from "../hooks/useImportRules";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { summarizeConditions } from "../lib/conditionsSummary";

import { DataTable } from "@/components/ui/data-table";

interface ImportRulesListProps {
  query: string;
}

/** Filterable list of import rules; selecting one opens it. */
export function ImportRulesList({
  query,
}: ImportRulesListProps) {
  const {
    data: rules, isLoading, error,
  } = useImportRules();
  const columns = useBookmarkColumns("import-rules-listing");
  const viewMode = useViewMode("import-rules-listing");
  const ruleColumns = useImportRuleColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  const visibleRules = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized === "") return rules ?? [];
    return (rules ?? []).filter(rule =>
      rule.name.toLowerCase().includes(normalized)
      || summarizeConditions(rule.conditions).toLowerCase().includes(normalized));
  }, [rules, query]);

  const hasRules = (rules?.length ?? 0) > 0;

  return (
    <section className="space-y-6">
      {isLoading ? <p className="text-muted-foreground">Loading rules…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && !hasRules
        ? <p className="text-muted-foreground">No import rules yet. Create one to get started.</p>
        : null}
      {!isLoading && hasRules && visibleRules.length === 0
        ? <p className="text-muted-foreground">No rules match the search.</p>
        : null}

      {viewMode === "table"
        ? (
          <DataTable
            columns={ruleColumns}
            data={visibleRules}
            sortable
            onRowClick={(rule, event) =>
              rowNav(event, "import-rule", rule.id, () => {
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
        )
        : (
          <div
            className={`
              grid gap-3
              ${COLUMN_CLASS[columns]}
            `}
          >
            {visibleRules.map(rule => (
              <ImportRuleListItem
                key={rule.id}
                rule={rule}
              />
            ))}
          </div>
        )}
    </section>
  );
}
