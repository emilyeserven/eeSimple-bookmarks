import type { AutofillRule } from "@eesimple/types";

import { AutofillRuleListItem } from "./AutofillRuleListItem";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useAutofillRulesList } from "./useAutofillRulesList";
import { COLUMN_CLASS } from "../lib/bookmarkColumns";

import { DataTable } from "@/components/ui/data-table";

interface AutofillRulesListProps {
  /** Show only rules that set this category. */
  categoryId?: string;
  /** Show only rules that set a value (number / boolean / datetime) for this custom property. */
  propertyId?: string;
  /** Show only rules whose conditions target this website (via a Website condition). */
  websiteId?: string;
  /** Show only rules that apply this tag. */
  tagId?: string;
  /** Show only rules that set this media type. */
  mediaTypeId?: string;
  /** Show only rules whose conditions target this YouTube channel (via a youtube-channel condition). */
  channelId?: string;
  /** Show only rules that set no category. */
  noCategory?: boolean;
  /** Current text-search query (matched against the rule name + its conditions summary). */
  query: string;
}

/** Read-only, filterable list of autofill rules; selecting one opens it in the panel. */
export function AutofillRulesList(props: AutofillRulesListProps) {
  const {
    isLoading, error, columns, viewMode, ruleColumns, categories,
    visibleRules, hasRules, deletableIds, selection, bulkDelete, openRule,
  } = useAutofillRulesList(props);

  return (
    <section className="space-y-6">
      {isLoading ? <p className="text-muted-foreground">Loading rules…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && !hasRules
        ? <p className="text-muted-foreground">No autofill rules yet. Create one to get started.</p>
        : null}
      {!isLoading && hasRules && visibleRules.length === 0
        ? <p className="text-muted-foreground">No rules match these filters.</p>
        : null}

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["rule", "rules"]}
      />

      {viewMode === "table"
        ? (
          <DataTable
            columns={[
              ...(selection.mode ? [listingSelectionColumn<AutofillRule>(selection, rule => rule.id)] : []),
              ...ruleColumns,
            ]}
            data={visibleRules}
            sortable
            onRowClick={openRule}
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
              <AutofillRuleListItem
                key={rule.id}
                rule={rule}
                categories={categories}
                selectable
                selected={selection.isSelected(rule.id)}
                onSelectToggle={() => selection.toggle(rule.id)}
                inSelectionMode={selection.mode}
              />
            ))}
          </div>
        )}
    </section>
  );
}
