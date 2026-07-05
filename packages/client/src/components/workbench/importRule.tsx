import type { EntityWorkbench } from "./types";
import type { ImportRule } from "@eesimple/types";

import i18n from "../../i18n";
import { ImportRuleConditionsForm } from "../ImportRuleConditionsForm";
import { ImportRuleConditionsFields, ImportRuleGeneralFields } from "../ImportRuleDetail";
import { ImportRuleGeneralForm } from "../ImportRuleGeneralForm";

import { useImportRuleById, useImportRuleBySlug, useDeleteImportRule } from "@/hooks/useImportRules";

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
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Name, description, action, and priority."),
        render: ({
          entity,
        }) => <ImportRuleGeneralFields rule={entity} />,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name, description, action, and priority."),
        render: ({
          entity,
        }) => <ImportRuleGeneralForm rule={entity} />,
      },
    },
    {
      key: "conditions",
      label: i18n.t("Conditions"),
      view: {
        title: i18n.t("Conditions"),
        description: i18n.t("When this rule fires."),
        render: ({
          entity,
        }) => <ImportRuleConditionsFields rule={entity} />,
      },
      edit: {
        title: i18n.t("Conditions"),
        description: i18n.t("URL match and website conditions that trigger this rule."),
        render: ({
          entity,
        }) => <ImportRuleConditionsForm rule={entity} />,
      },
    },
  ],
};
