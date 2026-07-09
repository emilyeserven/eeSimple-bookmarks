import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, TagNode } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { EntityAutofillSources } from "../EntityAutofillSources";
import { EntityNamesTabView, PrimaryLanguageTabView } from "../entityNames/EntityNamesTab";
import { GenreMoodAssignmentSection } from "../GenreMoodAssignmentSection";
import {
  TagDescriptionField,
  TagNameField,
  TagNamesEdit,
  TagOptionsFields,
  TagPrimaryLanguageEdit,
} from "../TagGeneralForm";
import { TagHierarchyView, TagParentEditView, TagStatsView } from "./tagViews";

import { useDeleteTag, useTagBySlug, useTagTree } from "@/hooks/useTags";
import { flattenTree } from "@/lib/tagTree";

/**
 * The tag workbench's field registry (#1106 layout editor, granularized #1193). The former single
 * `general` composite (bundling stats/name/description/primary-language/names/parent/options/
 * genres-moods) is now one placeable {@link WorkbenchField} per independently-backed sub-field — the
 * "Extraction (reverse direction)" recipe, same shape as `category.tsx`'s `primaryLanguage`/`names`
 * split: each field mounts its own hook/mutation, so no shared form-context provider is needed. `stats`
 * is **view-only** (Parent/Description values still show there even though they're edited separately);
 * `parent`/`name`/`description`/`options`/`genreMoods` are **edit-only**; `autofillSources` is
 * **view-only** — same asymmetric-field pattern as Category's `genreMoods`/`autofillSources`. `hierarchy`
 * stays view-only, which is what makes the Hierarchy tab disappear in edit mode for free. Authored as an
 * exhaustive `Record<TagFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type TagFieldKey
  = | "stats"
    | "name"
    | "description"
    | "primaryLanguage"
    | "names"
    | "parent"
    | "options"
    | "genreMoods"
    | "autofillSources"
    | "hierarchy"
    | "autofillRules";

const tagFields = {
  stats: {
    key: "stats",
    label: i18n.t("Stats"),
    view: TagStatsView,
  },
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: ({
      entity,
    }) => <TagNameField node={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    edit: ({
      entity,
    }) => <TagDescriptionField node={entity} />,
  },
  primaryLanguage: {
    key: "primaryLanguage",
    label: i18n.t("Primary language"),
    view: ({
      entity,
    }) => (
      <PrimaryLanguageTabView
        ownerType="tag"
        ownerId={entity.id}
      />
    ),
    edit: ({
      entity,
    }) => <TagPrimaryLanguageEdit node={entity} />,
  },
  names: {
    key: "names",
    label: i18n.t("Names"),
    view: ({
      entity,
    }) => (
      <EntityNamesTabView
        ownerType="tag"
        ownerId={entity.id}
      />
    ),
    edit: ({
      entity,
    }) => <TagNamesEdit node={entity} />,
  },
  parent: {
    key: "parent",
    label: i18n.t("Parent"),
    edit: TagParentEditView,
  },
  options: {
    key: "options",
    label: i18n.t("Options"),
    edit: ({
      entity,
    }) => <TagOptionsFields node={entity} />,
  },
  genreMoods: {
    key: "genreMoods",
    label: i18n.t("Genres & moods"),
    edit: ({
      entity,
    }) => (
      <GenreMoodAssignmentSection
        ownerType="tag"
        ownerId={entity.id}
      />
    ),
  },
  autofillSources: {
    key: "autofillSources",
    label: i18n.t("Autofill sources"),
    view: ({
      entity,
    }) => (
      <EntityAutofillSources
        match={{
          kind: "tag",
          tagId: entity.id,
        }}
      />
    ),
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
} satisfies Record<TagFieldKey, WorkbenchField<TagNode>>;

/**
 * The code-defined default layout. The General tab's field order preserves both modes' pre-migration
 * render order: view mode surfaces `stats`, `primaryLanguage`, `names`, `autofillSources` (matching the
 * old `TagGeneralView`); edit mode surfaces `name`, `primaryLanguage`, `description`, `names`, `parent`,
 * `options`, `genreMoods` (matching the old `TagGeneralForm`) — one field-key array satisfies both once
 * filtered by which renderer each mode has.
 */
const TAG_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: [
          "stats",
          "name",
          "primaryLanguage",
          "description",
          "names",
          "parent",
          "options",
          "genreMoods",
          "autofillSources",
        ] satisfies TagFieldKey[],
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
    },
  ],
};
