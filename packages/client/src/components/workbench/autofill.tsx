import type { EntityWorkbench } from "./types";
import type { AutofillRule } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillBackfillView } from "../AutofillBackfillView";
import { AutofillRuleConditionsForm } from "../AutofillRuleConditionsForm";
import { AutofillGeneralFields } from "../AutofillRuleDetail";
import { AutofillRuleGeneralForm } from "../AutofillRuleGeneralForm";
import { AutofillRulePrefillForm } from "../AutofillRulePrefillForm";
import { ConditionsView, DebugView, PrefillView } from "./autofillViews";

import { useAutofillRuleById, useAutofillRuleBySlug, useDeleteAutofillRule } from "@/hooks/useAutofill";

/** Single source of truth for an autofill rule's tabbed view/edit UI (main pane routes + right panel). */
export const autofillWorkbench: EntityWorkbench<AutofillRule> = {
  useBySlug: (slug) => {
    const {
      rule, isLoading,
    } = useAutofillRuleBySlug(slug);
    return {
      entity: rule,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      rule, isLoading, error,
    } = useAutofillRuleById(id);
    return {
      entity: rule,
      isLoading,
      error,
    };
  },
  name: rule => rule.name,
  useDelete: () => {
    const mutation = useDeleteAutofillRule();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Autofill rule not found."),
  navAriaLabel: i18n.t("Autofill rule sections"),
  getSlug: rule => rule.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: i18n.t("General"),
        description: i18n.t("Name, description, and priority."),
        render: ({
          entity,
        }) => <AutofillGeneralFields rule={entity} />,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name, description, and priority."),
        render: ({
          entity,
        }) => <AutofillRuleGeneralForm rule={entity} />,
      },
    },
    {
      key: "conditions",
      label: "Activation Conditions",
      view: {
        title: i18n.t("Activation Conditions"),
        description: i18n.t("When this rule fires."),
        render: ConditionsView,
      },
      edit: {
        title: i18n.t("Activation Conditions"),
        description: i18n.t("Configure when this rule should apply."),
        render: ({
          entity,
        }) => <AutofillRuleConditionsForm rule={entity} />,
      },
    },
    {
      key: "prefill",
      label: "What Gets Prefilled",
      view: {
        title: i18n.t("What Gets Prefilled"),
        description: i18n.t("Category, tags, and custom-property values set when this rule matches."),
        render: PrefillView,
      },
      edit: {
        title: i18n.t("What Gets Prefilled"),
        description: i18n.t("Configure the category, tags, and property values this rule sets."),
        render: ({
          entity,
        }) => <AutofillRulePrefillForm rule={entity} />,
      },
    },
    {
      key: "debug",
      label: "Debug",
      view: {
        title: i18n.t("Debug"),
        description: i18n.t("Rule and bookmark JSON for debugging rule matching with Claude."),
        render: DebugView,
      },
    },
    {
      key: "backfill",
      label: "Backfill",
      view: {
        title: i18n.t("Backfill"),
        description: i18n.t("Find matching bookmarks missing this rule's properties and apply them."),
        render: ({
          entity,
        }) => <AutofillBackfillView rule={entity} />,
      },
    },
  ],
};
