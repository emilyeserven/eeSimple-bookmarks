import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, TagNode } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { TagGeneralEdit, TagGeneralView, TagHierarchyView } from "./tagViews";

import { useDeleteTag, useTagBySlug, useTagTree } from "@/hooks/useTags";
import { flattenTree } from "@/lib/tagTree";

/**
 * The tag workbench's field registry (#1106 layout editor). Each existing tab pane becomes ONE
 * placeable, mode-aware {@link WorkbenchField} keyed by the tab's own key — the composite-editor
 * recipe (#1165): `general` bundles the existing `TagGeneralView`/`TagGeneralEdit` composites
 * unchanged, and `hierarchy` is **view-only** (no `edit`), which is what makes the Hierarchy tab
 * disappear in edit mode for free. Authored as an exhaustive `Record<TagFieldKey, …>` so a key
 * without a renderer fails `tsc`.
 */
type TagFieldKey
  = | "general"
    | "hierarchy"
    | "autofillRules"
    | "displayRules";

const tagFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: TagGeneralView,
    edit: TagGeneralEdit,
  },
  hierarchy: {
    key: "hierarchy",
    label: i18n.t("Hierarchy"),
    view: TagHierarchyView,
  },
  autofillRules: {
    key: "autofillRules",
    label: i18n.t("Autofill Rules"),
    view: ({
      entity,
    }) => (
      <AutofillRulesList
        tagId={entity.id}
        query=""
      />
    ),
    edit: ({
      entity,
    }) => (
      <AutofillRulesList
        tagId={entity.id}
        query=""
      />
    ),
  },
  displayRules: {
    key: "displayRules",
    label: i18n.t("Display Rules"),
    view: ({
      entity,
    }) => <CardDisplayRulesList tagId={entity.id} />,
    edit: ({
      entity,
    }) => <CardDisplayRulesList tagId={entity.id} />,
  },
} satisfies Record<TagFieldKey, WorkbenchField<TagNode>>;

/** The code-defined default layout — the current tab list, one untitled section per tab. */
const TAG_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies TagFieldKey[],
      }],
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
      sections: [{
        key: "hierarchy",
        fields: ["hierarchy"] satisfies TagFieldKey[],
      }],
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      sections: [{
        key: "autofill",
        fields: ["autofillRules"] satisfies TagFieldKey[],
      }],
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      sections: [{
        key: "display-rules",
        fields: ["displayRules"] satisfies TagFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a tag's tabbed view/edit UI (main pane routes + right panel). */
export const tagWorkbench: EntityWorkbench<TagNode> = {
  useBySlug: (slug) => {
    const {
      tag, isLoading,
    } = useTagBySlug(slug);
    return {
      entity: tag,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useTagTree();
    return {
      entity: flattenTree(data ?? []).find(item => item.node.id === id)?.node,
      isLoading,
      error,
    };
  },
  name: node => node.name,
  useDelete: () => {
    const mutation = useDeleteTag();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Tag not found."),
  navAriaLabel: i18n.t("Tag sections"),
  listingPath: "/tags",
  getSlug: tag => tag.slug,
  layoutKind: "tag",
  fields: tagFields,
  defaultLayout: TAG_DEFAULT_LAYOUT,
  // Layout-driven: the tab rail + section stacks come from `fields` + `defaultLayout`. `tabs` is
  // retained only to carry the code-only `group` nav metadata (the "Rules" More dropdown on the
  // edit strip), re-attached by tab key in `deriveWorkbenchTabs`.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      group: i18n.t("Rules"),
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      group: i18n.t("Rules"),
    },
  ],
};
