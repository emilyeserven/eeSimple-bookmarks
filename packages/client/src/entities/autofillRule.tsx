import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { AutofillRule, UpdateAutofillRuleInput } from "@eesimple/types";

import { AutofillListingCard } from "../components/AutofillListingCard";
import { AutofillRulesTable } from "../components/AutofillRulesTable";
import { autofillWorkbench } from "../components/workbench/autofill";
import { useAutofillRules, useBulkDeleteAutofillRules } from "../hooks/useAutofill";
import i18n from "../i18n";
import { autofillApi } from "../lib/api/autofill";
import { summarizeConditions } from "../lib/conditionsSummary";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const AUTOFILL_ROUTE: EntityRoute = {
  kind: "autofill",
  prefix: "/autofill",
  slugIndex: 1,
  listLabel: i18n.t("Autofill Rules"),
  singular: i18n.t("Rule"),
  switcher: "autofill",
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const AUTOFILL_PALETTE: EntityPaletteConfig = {
  queryKey: ["autofill-rules"],
  listFn: () => autofillApi.list(),
  updateFn: (id, patch) => autofillApi.update(id, patch as UpdateAutofillRuleInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
  extraEditTabs: [
    {
      label: i18n.t("Edit Conditions"),
      tab: "conditions",
    },
    {
      label: i18n.t("Edit Prefill"),
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
    noun: [i18n.t("rule"), i18n.t("rules")],
    loadingLabel: i18n.t("Loading rules…"),
    entityPlural: i18n.t("rules"),
    emptyMessage: (
      <p className="text-muted-foreground">
        {i18n.t("No autofill rules yet. Create one to get started.")}
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
