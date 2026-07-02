import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { AutofillRule, UpdateAutofillRuleInput } from "@eesimple/types";

import { AutofillListingCard } from "../components/AutofillListingCard";
import { AutofillRulesTable } from "../components/AutofillRulesTable";
import { autofillWorkbench } from "../components/workbench/autofill";
import { useAutofillRules, useBulkDeleteAutofillRules } from "../hooks/useAutofill";
import { autofillApi } from "../lib/api/autofill";
import { summarizeConditions } from "../lib/conditionsSummary";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const AUTOFILL_ROUTE: EntityRoute = {
  kind: "autofill",
  prefix: "/autofill",
  slugIndex: 1,
  listLabel: "Autofill Rules",
  singular: "Rule",
  switcher: "autofill",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const AUTOFILL_PALETTE: EntityPaletteConfig = {
  queryKey: ["autofill-rules"],
  listFn: () => autofillApi.list(),
  updateFn: (id, patch) => autofillApi.update(id, patch as UpdateAutofillRuleInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
  extraEditTabs: [
    {
      label: "Edit Conditions",
      tab: "conditions",
    },
    {
      label: "Edit Prefill",
      tab: "prefill",
    },
  ],
};

/**
 * Built as a factory (not a static module-level config) because the unscoped `/autofill` listing
 * layers the URL-driven sidebar facets on top of the scaffold: the page memoizes
 * `ruleMatchesFacets` over the resolved facet state and passes it in as the `externalFilter`.
 * `autofillDescriptor` below references a no-op instance since `EntityDescriptor.listing` isn't
 * consumed by anything yet. The entity-scoped embeds (the workbench Autofill tabs) keep rendering
 * `AutofillRulesList` and never construct one of these.
 */
export function buildAutofillListingConfig(opts: {
  matchesFacets: (rule: AutofillRule) => boolean;
}): EntityListingConfig<AutofillRule> {
  return {
    pageKey: "autofill-rules-listing",
    useItems: useAutofillRules,
    externalFilter: opts.matchesFacets,
    matches: (rule, query) =>
      rule.name.toLowerCase().includes(query)
      || summarizeConditions(rule.conditions).toLowerCase().includes(query),
    useBulkDelete: useBulkDeleteAutofillRules,
    noun: ["rule", "rules"],
    loadingLabel: "Loading rules…",
    entityPlural: "rules",
    emptyMessage: (
      <p className="text-muted-foreground">
        No autofill rules yet. Create one to get started.
      </p>
    ),
    renderListItem: ({
      entity, selectable, selected, onSelectToggle, inSelectionMode,
    }) => (
      <AutofillListingCard
        rule={entity}
        selectable={selectable}
        selected={selected}
        onSelectToggle={onSelectToggle}
        inSelectionMode={inSelectionMode}
      />
    ),
    renderTable: ({
      entities, selection,
    }) => (
      <AutofillRulesTable
        rules={entities}
        selection={selection}
      />
    ),
  };
}

/** Twelfth `EntityDescriptor` migration (batch 3, after PlaceType #884) — issue #860. */
export const autofillDescriptor: EntityDescriptor<AutofillRule> = {
  kind: "autofill",
  route: AUTOFILL_ROUTE,
  palette: AUTOFILL_PALETTE,
  workbench: autofillWorkbench,
  listing: buildAutofillListingConfig({
    matchesFacets: () => true,
  }),
};
