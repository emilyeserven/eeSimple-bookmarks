import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, ImportRule } from "@eesimple/types";

import i18n from "../../i18n";
import { ImportRuleConditionsForm } from "../ImportRuleConditionsForm";
import {
  ImportRuleActionView,
  ImportRuleAddedView,
  ImportRuleConditionsFields,
  ImportRuleDescriptionView,
  ImportRulePriorityView,
  ImportRuleSlugView,
} from "../ImportRuleDetail";
import {
  ImportRuleActionEditField,
  ImportRuleDescriptionEditField,
  ImportRuleNameEditField,
  ImportRuleSortOrderEditField,
} from "../ImportRuleGeneralForm";

import { useImportRuleById, useImportRuleBySlug, useDeleteImportRule } from "@/hooks/useImportRules";

/**
 * The import-rule workbench's field registry (#1106 layout editor). The old single `general` composite is
 * fully atomized (#1371, following the media-type #1189 reference) into per-field, mode-aware
 * {@link WorkbenchField}s; `conditions`'s edit renderer is the URL/website conditions builder, kept as one
 * opaque block (the composite-editor recipe #1165). `name` is **edit-only**; `slug`/`added` are
 * **view-only**; `action`/`sortOrder`/`description` carry both. Authored as an exhaustive
 * `Record<ImportRuleFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type ImportRuleFieldKey
  = | "name"
    | "description"
    | "action"
    | "sortOrder"
    | "slug"
    | "added"
    | "conditions";

const importRuleFields = {
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: ({
      entity,
    }) => <ImportRuleNameEditField rule={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: ({
      entity,
    }) => <ImportRuleDescriptionView rule={entity} />,
    edit: ({
      entity,
    }) => <ImportRuleDescriptionEditField rule={entity} />,
  },
  action: {
    key: "action",
    label: i18n.t("Action"),
    view: ({
      entity,
    }) => <ImportRuleActionView rule={entity} />,
    edit: ({
      entity,
    }) => <ImportRuleActionEditField rule={entity} />,
  },
  sortOrder: {
    key: "sortOrder",
    label: i18n.t("Priority"),
    view: ({
      entity,
    }) => <ImportRulePriorityView rule={entity} />,
    edit: ({
      entity,
    }) => <ImportRuleSortOrderEditField rule={entity} />,
  },
  slug: {
    key: "slug",
    label: i18n.t("Slug"),
    view: ({
      entity,
    }) => <ImportRuleSlugView rule={entity} />,
  },
  added: {
    key: "added",
    label: i18n.t("Added"),
    view: ({
      entity,
    }) => <ImportRuleAddedView rule={entity} />,
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

/**
 * The code-defined default layout — the General tab (atomized) then the Conditions tab. The General
 * section lists the atomized fields in one order that keeps the edit-visible subset
 * (`name`/`description`/`action`/`sortOrder`) exactly the pre-#1371 form order; the view-visible subset
 * (`description`/`action`/`sortOrder`/`slug`/`added`) reads description-first (byte-identity is waived, as
 * for media-type — the old view and edit orders differed).
 */
const IMPORT_RULE_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["name", "description", "action", "sortOrder", "slug", "added"] satisfies ImportRuleFieldKey[],
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
