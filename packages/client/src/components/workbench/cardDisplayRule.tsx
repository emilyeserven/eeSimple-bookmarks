import type { EntityWorkbench, WorkbenchField } from "./types";
import type { CardDisplayRule, EntityLayout } from "@eesimple/types";

import i18n from "../../i18n";
import { CardDisplayRuleConditionsForm } from "../CardDisplayRuleConditionsForm";
import { CardDisplayRuleDisplayProvider } from "../CardDisplayRuleDisplayContext";
import { CardDisplayRuleGeneralForm } from "../CardDisplayRuleGeneralForm";
import {
  CardDisplayRuleConditionsView,
  CardDisplayRuleDisplayView,
  CardDisplayRuleGeneralView,
} from "../CardDisplayRuleViews";
import {
  CardDisplayRuleCardZoneLayoutsField,
  CardDisplayRuleFieldZonesField,
  CardDisplayRuleHideWebsiteField,
  CardDisplayRuleImageAspectField,
  CardDisplayRuleImageLayoutField,
  CardDisplayRuleImageVisibilityField,
  CardDisplayRulePreviewEditField,
} from "./cardDisplayRuleDisplayFields";

import { useCardDisplayRuleById, useCardDisplayRuleBySlug, useDeleteCardDisplayRule } from "@/hooks/useCardDisplayRules";

/**
 * The card-display-rule workbench's field registry (#1106 layout editor). `general` and `conditions`
 * are whole tab panes (the Conditions builder is a composite editor kept as one field, hidden for the
 * Default rule via its own `showIf`). The former single opaque `display` composite is **atomized**
 * (#1198) into independently-placeable fields — the four image-presentation overrides, the
 * `CardFieldZoneBoard` (kept one composite field), the section-layout controls, and a `preview` — each
 * granular edit field reading the one shared `RuleDisplayValue` controller from
 * `CardDisplayRuleDisplayProvider` via the shared-`useAppForm` extraction seam (#1188:
 * `sharedFormFieldKeys` + `editFormProvider`, mirroring `websiteWorkbench`). Authored as an exhaustive
 * `Record<CardDisplayRuleFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type CardDisplayRuleFieldKey
  = | "general"
    | "conditions"
    | "imageVisibility"
    | "imageMode"
    | "imageLayout"
    | "hideWebsiteForYouTube"
    | "fieldZones"
    | "cardZoneLayouts"
    | "preview";

/** The Display-tab field keys whose `edit` renderer reads the shared `useCardDisplayRuleDisplay`
 *  controller from {@link CardDisplayRuleDisplayProvider}. Drives `EntityEditView`'s provider gate. */
const CARD_DISPLAY_RULE_SHARED_FORM_FIELD_KEYS = new Set<string>([
  "imageVisibility",
  "imageMode",
  "imageLayout",
  "hideWebsiteForYouTube",
  "fieldZones",
  "cardZoneLayouts",
  "preview",
]);

const cardDisplayRuleFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: CardDisplayRuleGeneralView,
    edit: CardDisplayRuleGeneralForm,
  },
  conditions: {
    key: "conditions",
    label: i18n.t("Conditions"),
    showIf: rule => !rule.isDefault,
    view: CardDisplayRuleConditionsView,
    edit: CardDisplayRuleConditionsForm,
  },
  imageVisibility: {
    key: "imageVisibility",
    label: i18n.t("Image visibility"),
    edit: () => <CardDisplayRuleImageVisibilityField />,
  },
  imageMode: {
    key: "imageMode",
    label: i18n.t("Image aspect"),
    edit: () => <CardDisplayRuleImageAspectField />,
  },
  imageLayout: {
    key: "imageLayout",
    label: i18n.t("Image layout"),
    edit: () => <CardDisplayRuleImageLayoutField />,
  },
  hideWebsiteForYouTube: {
    key: "hideWebsiteForYouTube",
    label: i18n.t("Website pill on YouTube"),
    edit: () => <CardDisplayRuleHideWebsiteField />,
  },
  fieldZones: {
    key: "fieldZones",
    label: i18n.t("Card fields"),
    edit: () => <CardDisplayRuleFieldZonesField />,
  },
  cardZoneLayouts: {
    key: "cardZoneLayouts",
    label: i18n.t("Section layout"),
    edit: () => <CardDisplayRuleCardZoneLayoutsField />,
  },
  preview: {
    key: "preview",
    label: i18n.t("Card preview"),
    view: CardDisplayRuleDisplayView,
    edit: () => <CardDisplayRulePreviewEditField />,
  },
} satisfies Record<CardDisplayRuleFieldKey, WorkbenchField<CardDisplayRule>>;

/**
 * The code-defined default layout — the current three tabs. The Display tab now holds the atomized
 * display fields in one untitled section, in the same top-to-bottom order the opaque composite
 * rendered them (image rows → field zones → section layout → preview). In **view** mode every
 * display field but `preview` is edit-only and drops out, so the Display view stays the single
 * read-only card preview it was.
 */
const CARD_DISPLAY_RULE_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies CardDisplayRuleFieldKey[],
      }],
    },
    {
      key: "conditions",
      label: i18n.t("Conditions"),
      sections: [{
        key: "conditions",
        fields: ["conditions"] satisfies CardDisplayRuleFieldKey[],
      }],
    },
    {
      key: "display",
      label: i18n.t("Display"),
      sections: [{
        key: "display",
        fields: [
          "imageVisibility",
          "imageMode",
          "imageLayout",
          "hideWebsiteForYouTube",
          "fieldZones",
          "cardZoneLayouts",
          "preview",
        ] satisfies CardDisplayRuleFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a card display rule's tabbed view/edit UI (main pane routes + right panel). */
export const cardDisplayRuleWorkbench: EntityWorkbench<CardDisplayRule> = {
  useBySlug: (slug) => {
    const {
      rule, isLoading,
    } = useCardDisplayRuleBySlug(slug);
    return {
      entity: rule,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      rule, isLoading, error,
    } = useCardDisplayRuleById(id);
    return {
      entity: rule,
      isLoading,
      error: error ?? null,
    };
  },
  name: rule => rule.name,
  canDelete: rule => !rule.isDefault,
  useDelete: () => {
    const mutation = useDeleteCardDisplayRule();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Card display rule not found."),
  navAriaLabel: i18n.t("Card display rule sections"),
  getSlug: rule => rule.slug,
  layoutKind: "card-display-rule",
  fields: cardDisplayRuleFields,
  defaultLayout: CARD_DISPLAY_RULE_DEFAULT_LAYOUT,
  // Shared-`useAppForm` extraction (#1188, #1198): the granular Display edit fields read one controller
  // from `CardDisplayRuleDisplayProvider`, which `EntityEditView` mounts around the edit body whenever
  // the active tab hosts one of these keys.
  sharedFormFieldKeys: CARD_DISPLAY_RULE_SHARED_FORM_FIELD_KEYS,
  editFormProvider: ({
    entity, children,
  }) => <CardDisplayRuleDisplayProvider rule={entity}>{children}</CardDisplayRuleDisplayProvider>,
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
    {
      key: "display",
      label: i18n.t("Display"),
    },
  ],
};
