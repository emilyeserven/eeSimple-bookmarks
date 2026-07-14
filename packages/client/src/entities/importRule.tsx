import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { ImportRule, UpdateImportRuleInput } from "@eesimple/types";

import { ImportRuleListItem } from "../components/ImportRuleListItem";
import { ImportRuleTable } from "../components/ImportRuleTable";
import { importRuleWorkbench } from "../components/workbench/importRule";
import { useBulkDeleteImportRules, useImportRules } from "../hooks/useImportRules";
import i18n from "../i18n";
import { importRulesApi } from "../lib/api/importRules";
import { summarizeConditions } from "../lib/conditionsSummary";
import { starredPaletteField } from "../lib/starredPaletteField";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const IMPORT_RULE_ROUTE: EntityRoute = {
  kind: "import-rule",
  prefix: "/import-rules",
  slugIndex: 1,
  listLabel: i18n.t("Import Rules"),
  singular: i18n.t("Rule"),
  switcher: "import-rule",
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const IMPORT_RULE_PALETTE: EntityPaletteConfig = {
  queryKey: ["import-rules"],
  listFn: () => importRulesApi.list(),
  updateFn: (id, patch) => importRulesApi.update(id, patch as UpdateImportRuleInput),
  extraEditTabs: [
    {
      label: i18n.t("Edit Conditions"),
      tab: "conditions",
    },
  ],
  fields: [starredPaletteField],
};

export const importRuleListingConfig: EntityListingConfig<ImportRule> = {
  pageKey: "import-rules-listing",
  useItems: useImportRules,
  matches: (rule, query) => rule.name.toLowerCase().includes(query)
    || summarizeConditions(rule.conditions).toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteImportRules,
  noun: [i18n.t("import rule"), i18n.t("import rules")],
  loadingLabel: i18n.t("Loading rules…"),
  entityPlural: i18n.t("rules"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No import rules yet. Create one to get started.")}
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <ImportRuleListItem
      rule={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <ImportRuleTable
      rules={entities}
      selection={selection}
    />
  ),
};

/** Batch-3 `EntityDescriptor` migration (issue #860). */
export const importRuleDescriptor: EntityDescriptor<ImportRule> = {
  kind: "import-rule",
  route: IMPORT_RULE_ROUTE,
  palette: IMPORT_RULE_PALETTE,
  workbench: importRuleWorkbench,
  listing: importRuleListingConfig,
};
