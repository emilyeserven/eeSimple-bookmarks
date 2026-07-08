import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, ImportRule } from "@eesimple/types";

import i18n from "../../i18n";
import { ImportRuleConditionsForm } from "../ImportRuleConditionsForm";
import { ImportRuleConditionsFields, ImportRuleGeneralFields } from "../ImportRuleDetail";
import { ImportRuleGeneralForm } from "../ImportRuleGeneralForm";

import { useImportRuleById, useImportRuleBySlug, useDeleteImportRule } from "@/hooks/useImportRules";

/**
 * The import-rule workbench's field registry (#1106 layout editor). Each existing tab pane
 * becomes ONE placeable, mode-aware {@link WorkbenchField} keyed by the tab's own key — the
 * composite-editor recipe (#1165): `conditions`'s edit renderer is the URL/website conditions
 * builder, kept as one opaque block. Authored as an exhaustive `Record<ImportRuleFieldKey, …>` so a
 * key without a renderer fails `tsc`.
 */
type ImportRuleFieldKey
  = | "general"
    | "conditions";

const importRuleFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: ({
      entity,
    }) => <ImportRuleGeneralFields rule={entity} />,
    edit: ({
      entity,
    }) => <ImportRuleGeneralForm rule={entity} />,
  },
  conditions: {
    key: "conditions",
    label: i18n.t("Conditions"),
    view: ({
      entity,
    }) => <ImportRuleConditionsFields rule={entity} />,
    edit: ({
      entity,
    }) => <ImportRuleConditionsForm rule={entity} />,
  },
} satisfies Record<ImportRuleFieldKey, WorkbenchField<ImportRule>>;

/** The code-defined default layout — the current tab list, one untitled section per tab. */
const IMPORT_RULE_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies ImportRuleFieldKey[],
      }],
    },
    {
      key: "conditions",
      label: i18n.t("Conditions"),
      sections: [{
        key: "conditions",
        fields: ["conditions"] satisfies ImportRuleFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for an import rule's tabbed view/edit UI (main pane routes + right panel). */
export const importRuleWorkbench: EntityWorkbench<ImportRule> = {
  useBySlug: (slug) => {
    const {
      rule, isLoading,
    } = useImportRuleBySlug(slug);
    return {
      entity: rule,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      rule, isLoading, error,
    } = useImportRuleById(id);
    return {
      entity: rule,
      isLoading,
      error,
    };
  },
  name: rule => rule.name,
  useDelete: () => {
    const mutation = useDeleteImportRule();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Import rule not found."),
  navAriaLabel: i18n.t("Import rule sections"),
  getSlug: rule => rule.slug,
  layoutKind: "import-rule",
  fields: importRuleFields,
  defaultLayout: IMPORT_RULE_DEFAULT_LAYOUT,
  // Layout-driven: the tab rail + section stacks come from `fields` + `defaultLayout`. `tabs` is
  // retained only to satisfy the descriptor's type requirement — a config entity, so no nav groups.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "conditions",
      label: i18n.t("Conditions"),
    },
  ],
};
