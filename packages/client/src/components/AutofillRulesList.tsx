import { useMemo } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AutofillRuleListItem } from "./AutofillRuleListItem";
import { useAutofillRuleColumns } from "./tables/autofillRuleColumns";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useAutofillRules } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useWebsiteDomain } from "../hooks/useWebsiteDomain";
import { ruleSetsMediaType, ruleSetsProperty, ruleSetsTag, ruleTargetsWebsite, ruleTargetsYoutubeChannel } from "../lib/autofillRulesFilter";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { summarizeConditions } from "../lib/conditionsSummary";

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
export function AutofillRulesList({
  categoryId,
  propertyId,
  websiteId,
  tagId,
  mediaTypeId,
  channelId,
  noCategory,
  query,
}: AutofillRulesListProps) {
  const {
    data: rules, isLoading, error,
  } = useAutofillRules();
  const {
    data: categories,
  } = useCategories();

  const columns = useBookmarkColumns("autofill-rules-listing");
  const viewMode = useViewMode("autofill-rules-listing");
  const ruleColumns = useAutofillRuleColumns(categories ?? []);
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  // The scoping website's normalized domain (rules reference websites by domain, not id).
  const websiteDomain = useWebsiteDomain(websiteId);

  // Apply the active facet filters (they combine — AND) before the text search.
  const filteredRules = useMemo(() => {
    let list = rules ?? [];
    if (categoryId) list = list.filter(rule => rule.setCategoryId === categoryId);
    if (noCategory) list = list.filter(rule => rule.setCategoryId === null);
    if (propertyId) list = list.filter(rule => ruleSetsProperty(rule, propertyId));
    if (websiteId) list = websiteDomain ? list.filter(rule => ruleTargetsWebsite(rule, websiteDomain)) : [];
    if (tagId) list = list.filter(rule => ruleSetsTag(rule, tagId));
    if (mediaTypeId) list = list.filter(rule => ruleSetsMediaType(rule, mediaTypeId));
    if (channelId) list = list.filter(rule => ruleTargetsYoutubeChannel(rule, channelId));
    return list;
  }, [rules, categoryId, noCategory, propertyId, websiteId, websiteDomain, tagId, mediaTypeId, channelId]);

  const visibleRules = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized === "") return filteredRules;
    return filteredRules.filter(rule =>
      rule.name.toLowerCase().includes(normalized)
      || summarizeConditions(rule.conditions).toLowerCase().includes(normalized));
  }, [filteredRules, query]);

  const hasRules = (rules?.length ?? 0) > 0;

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

      {viewMode === "table"
        ? (
          <DataTable
            columns={ruleColumns}
            data={visibleRules}
            sortable
            onRowClick={(rule, event) =>
              rowNav(event, "autofill", rule.id, () => {
                void navigate({
                  to: "/autofill/$ruleSlug",
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
              <AutofillRuleListItem
                key={rule.id}
                rule={rule}
                categories={categories ?? []}
              />
            ))}
          </div>
        )}
    </section>
  );
}
