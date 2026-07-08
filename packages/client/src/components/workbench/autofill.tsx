import type { EntityWorkbench, WorkbenchField } from "./types";
import type { AutofillRule, EntityLayout } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillBackfillView } from "../AutofillBackfillView";
import { AutofillRuleConditionsForm } from "../AutofillRuleConditionsForm";
import { AutofillGeneralFields } from "../AutofillRuleDetail";
import { AutofillRuleGeneralForm } from "../AutofillRuleGeneralForm";
import { AutofillRulePrefillForm } from "../AutofillRulePrefillForm";
import { ConditionsView, DebugView, PrefillView } from "./autofillViews";

import { useAutofillRuleById, useAutofillRuleBySlug, useDeleteAutofillRule } from "@/hooks/useAutofill";

/**
 * The autofill-rule workbench's field registry (#1106 layout editor). Each existing tab pane
 * becomes ONE placeable, mode-aware {@link WorkbenchField} keyed by the tab's own key — the
 * composite-editor recipe (#1165): the `conditions` field's edit renderer is the Activation
 * Conditions builder, kept as one opaque block per "a composite editor (Conditions builder, …)
 * registers as ONE field; its internals are not decomposed." `debug` and `backfill` are
 * **view-only** (no `edit`), which is what makes those tabs disappear in edit mode for free.
 * Authored as an exhaustive `Record<AutofillFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type AutofillFieldKey
  = | "general"
    | "conditions"
    | "prefill"
    | "debug"
    | "backfill";

const autofillFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: ({
      entity,
    }) => <AutofillGeneralFields rule={entity} />,
    edit: ({
      entity,
    }) => <AutofillRuleGeneralForm rule={entity} />,
  },
  conditions: {
    key: "conditions",
    label: i18n.t("Activation Conditions"),
    view: ConditionsView,
    edit: ({
      entity,
    }) => <AutofillRuleConditionsForm rule={entity} />,
  },
  prefill: {
    key: "prefill",
    label: i18n.t("What Gets Prefilled"),
    view: PrefillView,
    edit: ({
      entity,
    }) => <AutofillRulePrefillForm rule={entity} />,
  },
  debug: {
    key: "debug",
    label: i18n.t("Debug"),
    view: DebugView,
  },
  backfill: {
    key: "backfill",
    label: i18n.t("Backfill"),
    view: ({
      entity,
    }) => <AutofillBackfillView rule={entity} />,
  },
} satisfies Record<AutofillFieldKey, WorkbenchField<AutofillRule>>;

/** The code-defined default layout — the current tab list, one untitled section per tab. */
const AUTOFILL_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies AutofillFieldKey[],
      }],
    },
    {
      key: "conditions",
      label: i18n.t("Activation Conditions"),
      sections: [{
        key: "conditions",
        fields: ["conditions"] satisfies AutofillFieldKey[],
      }],
    },
    {
      key: "prefill",
      label: i18n.t("What Gets Prefilled"),
      sections: [{
        key: "prefill",
        fields: ["prefill"] satisfies AutofillFieldKey[],
      }],
    },
    {
      key: "debug",
      label: i18n.t("Debug"),
      sections: [{
        key: "debug",
        fields: ["debug"] satisfies AutofillFieldKey[],
      }],
    },
    {
      key: "backfill",
      label: i18n.t("Backfill"),
      sections: [{
        key: "backfill",
        fields: ["backfill"] satisfies AutofillFieldKey[],
      }],
    },
  ],
};

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
  layoutKind: "autofill",
  fields: autofillFields,
  defaultLayout: AUTOFILL_DEFAULT_LAYOUT,
  // Layout-driven: the tab rail + section stacks come from `fields` + `defaultLayout`. `tabs` is
  // retained only to satisfy the descriptor's type requirement — a config entity, so no nav groups.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "conditions",
      label: i18n.t("Activation Conditions"),
    },
    {
      key: "prefill",
      label: i18n.t("What Gets Prefilled"),
    },
    {
      key: "debug",
      label: i18n.t("Debug"),
    },
    {
      key: "backfill",
      label: i18n.t("Backfill"),
    },
  ],
};
