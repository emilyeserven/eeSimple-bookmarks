import { useMemo, useState } from "react";

import { normalizeDomain } from "@eesimple/types";

import { NO_CATEGORY } from "./AutofillRuleForm";
import { AutofillRuleListItem } from "./AutofillRuleListItem";
import { ALL_CATEGORIES, AutofillRulesToolbar } from "./AutofillRulesToolbar";
import { usePanelControls } from "./panel/usePanelControls";
import { useAutofillRules } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useWebsites } from "../hooks/useWebsites";
import { ruleSetsMediaType, ruleSetsProperty, ruleSetsTag, ruleTargetsWebsite, ruleTargetsYoutubeChannel } from "../lib/autofillRulesFilter";
import { summarizeConditions } from "../lib/conditionsSummary";

import { NEW_SENTINEL } from "@/lib/drawerSearch";

interface AutofillRulesListProps {
  /**
   * When set, scopes the list to a single category: only rules that set this category are
   * shown and the category filter is hidden.
   */
  categoryId?: string;
  /**
   * When set, scopes the list to a single custom property: only rules that set a value for this
   * property (number / boolean / datetime) are shown and the category filter is hidden.
   */
  propertyId?: string;
  /**
   * When set, scopes the list to a single website: only rules whose conditions target this website
   * (via a Website condition) are shown and the category filter is hidden.
   */
  websiteId?: string;
  /**
   * When set, scopes the list to a single tag: only rules that apply this tag are shown and the
   * category filter is hidden.
   */
  tagId?: string;
  /**
   * When set, scopes the list to a single media type: only rules that set this media type are shown
   * and the category filter is hidden.
   */
  mediaTypeId?: string;
  /**
   * When set, scopes the list to a single YouTube channel: only rules whose conditions target this
   * channel (via a youtube-channel condition) are shown and the category filter is hidden.
   */
  channelId?: string;
}

function emptyStateMessage(
  categoryId: string | undefined,
  propertyId: string | undefined,
  websiteId: string | undefined,
  tagId: string | undefined,
  mediaTypeId: string | undefined,
  channelId: string | undefined,
): string {
  if (categoryId) return "No autofill rules add bookmarks to this category yet. Create one above.";
  if (propertyId) return "No autofill rules set this property yet. Create one above.";
  if (websiteId) return "No autofill rules target this website yet. Create one above.";
  if (tagId) return "No autofill rules apply this tag yet. Create one above.";
  if (mediaTypeId) return "No autofill rules set this media type yet. Create one above.";
  if (channelId) return "No autofill rules target this channel yet. Create one above.";
  return "No autofill rules yet. Create one above.";
}

/** Read-only, searchable/filterable list of autofill rules; selecting one opens it in the panel. */
export function AutofillRulesList({
  categoryId,
  propertyId,
  websiteId,
  tagId,
  mediaTypeId,
  channelId,
}: AutofillRulesListProps = {}) {
  const {
    openAutofill,
  } = usePanelControls();
  const {
    data: rules, isLoading, error,
  } = useAutofillRules();
  const {
    data: categories,
  } = useCategories();
  const {
    data: websites,
  } = useWebsites();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);

  // Whether the list is scoped to a single entity (category / property / website / tag / media type / channel edit/view tab).
  const scoped = Boolean(categoryId) || Boolean(propertyId) || Boolean(websiteId) || Boolean(tagId) || Boolean(mediaTypeId) || Boolean(channelId);

  // The scoping website's normalized domain (rules reference websites by domain, not id).
  const websiteDomain = useMemo(() => {
    if (!websiteId) return undefined;
    const domain = (websites ?? []).find(site => site.id === websiteId)?.domain;
    return domain ? normalizeDomain(domain) : undefined;
  }, [websites, websiteId]);

  // Scope to the entity in context before any search/category filtering.
  const scopedRules = useMemo(() => {
    let list = rules ?? [];
    if (categoryId) list = list.filter(rule => rule.setCategoryId === categoryId);
    if (propertyId) list = list.filter(rule => ruleSetsProperty(rule, propertyId));
    if (websiteId) list = websiteDomain ? list.filter(rule => ruleTargetsWebsite(rule, websiteDomain)) : [];
    if (tagId) list = list.filter(rule => ruleSetsTag(rule, tagId));
    if (mediaTypeId) list = list.filter(rule => ruleSetsMediaType(rule, mediaTypeId));
    if (channelId) list = list.filter(rule => ruleTargetsYoutubeChannel(rule, channelId));
    return list;
  }, [rules, categoryId, propertyId, websiteId, websiteDomain, tagId, mediaTypeId, channelId]);

  const visibleRules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scopedRules.filter((rule) => {
      const matchesSearch = query === ""
        || rule.name.toLowerCase().includes(query)
        || summarizeConditions(rule.conditions).toLowerCase().includes(query);
      const matchesCategory = categoryFilter === ALL_CATEGORIES
        || (categoryFilter === NO_CATEGORY
          ? rule.setCategoryId === null
          : rule.setCategoryId === categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [scopedRules, search, categoryFilter]);

  return (
    <section className="space-y-6">
      <AutofillRulesToolbar
        search={search}
        onSearchChange={setSearch}
        scoped={scoped}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categories={categories ?? []}
        onCreateClick={scoped ? () => openAutofill(NEW_SENTINEL) : undefined}
      />

      {isLoading ? <p className="text-muted-foreground">Loading rules…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && scopedRules.length === 0
        ? <p className="text-muted-foreground">{emptyStateMessage(categoryId, propertyId, websiteId, tagId, mediaTypeId, channelId)}</p>
        : null}
      {!isLoading && scopedRules.length > 0 && visibleRules.length === 0
        ? <p className="text-muted-foreground">No rules match these filters.</p>
        : null}

      <div className="space-y-3">
        {visibleRules.map(rule => (
          <AutofillRuleListItem
            key={rule.id}
            rule={rule}
            categories={categories ?? []}
          />
        ))}
      </div>
    </section>
  );
}
