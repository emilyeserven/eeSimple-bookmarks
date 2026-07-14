/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, GroupType } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import i18n from "../../i18n";
import {
  GroupTypeDescriptionEditField,
  GroupTypeNameEditField,
  GroupTypeSortOrderEditField,
} from "../GroupTypeGeneralForm";

import { DetailField } from "@/components/DetailField";
import {
  useDeleteGroupType,
  useGroupTypes,
  useGroupTypeBySlug,
} from "@/hooks/useGroupTypes";

interface GroupTypeViewProps {
  groupType: GroupType;
}

/** "Added" (created date) row. */
function GroupTypeAddedView({
  groupType,
}: GroupTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Added")}>{new Date(groupType.createdAt).toLocaleDateString()}</DetailField>;
}

/** "Slug" row (monospace). */
function GroupTypeSlugView({
  groupType,
}: GroupTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Slug")}>
      <span className="font-mono">{groupType.slug}</span>
    </DetailField>
  );
}

/** "Sort order" row. */
function GroupTypeSortOrderView({
  groupType,
}: GroupTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Sort order")}>{groupType.sortOrder}</DetailField>;
}

/** "Description" row — self-hiding when empty. */
function GroupTypeDescriptionView({
  groupType,
}: GroupTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Description")}>{groupType.description || null}</DetailField>;
}

/** "Groups" (count) row — self-hiding when the count wasn't hydrated. */
function GroupTypeGroupsView({
  groupType,
}: GroupTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Groups")}>{groupType.groupCount ?? null}</DetailField>;
}

/**
 * The group type workbench's field registry (#1106 layout editor). The old single `general` composite is
 * fully atomized (#1371, following the media-type #1189 reference) into per-field, mode-aware
 * {@link WorkbenchField}s so an operator can place each independently in **Settings → Page Layouts**. Each
 * edit field owns its own single-field `useAppForm` + `useFieldAutoSave` — no form-context provider
 * needed (the Category precedent). `name` is **edit-only**; `added`/`slug`/`groups` are **view-only**;
 * `sortOrder`/`description` carry both. Authored as an exhaustive `Record<GroupTypeFieldKey, …>` so a key
 * without a renderer fails `tsc`.
 */
type GroupTypeFieldKey
  = | "added"
    | "slug"
    | "name"
    | "sortOrder"
    | "description"
    | "groups";

const groupTypeFields = {
  added: {
    key: "added",
    label: i18n.t("Added"),
    view: ({
      entity,
    }) => <GroupTypeAddedView groupType={entity} />,
  },
  slug: {
    key: "slug",
    label: i18n.t("Slug"),
    view: ({
      entity,
    }) => <GroupTypeSlugView groupType={entity} />,
  },
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: ({
      entity,
    }) => <GroupTypeNameEditField groupType={entity} />,
  },
  sortOrder: {
    key: "sortOrder",
    label: i18n.t("Sort order"),
    view: ({
      entity,
    }) => <GroupTypeSortOrderView groupType={entity} />,
    edit: ({
      entity,
    }) => <GroupTypeSortOrderEditField groupType={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: ({
      entity,
    }) => <GroupTypeDescriptionView groupType={entity} />,
    edit: ({
      entity,
    }) => <GroupTypeDescriptionEditField groupType={entity} />,
  },
  groups: {
    key: "groups",
    label: i18n.t("Groups"),
    view: ({
      entity,
    }) => <GroupTypeGroupsView groupType={entity} />,
  },
} satisfies Record<GroupTypeFieldKey, WorkbenchField<GroupType>>;

/**
 * The code default layout: one General tab, one untitled section listing every atomized field in one
 * per-mode-sensible order — the view-visible subset (`added`/`slug`/`sortOrder`/`description`/`groups`)
 * reproduces the pre-#1371 `<dl>` order, and the edit-visible subset (`name`/`sortOrder`/`description`)
 * reproduces the pre-#1371 form order.
 */
const GROUP_TYPE_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["added", "slug", "name", "sortOrder", "description", "groups"] satisfies GroupTypeFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a group type's view/edit UI (main pane routes + right panel). */
export const groupTypeWorkbench: EntityWorkbench<GroupType> = {
  useBySlug: (slug) => {
    const {
      groupType, isLoading,
    } = useGroupTypeBySlug(slug);
    return {
      entity: groupType,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useGroupTypes();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: groupType => groupType.name,
  useDelete: () => {
    const mutation = useDeleteGroupType();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Group type not found."),
  navAriaLabel: i18n.t("Group type sections"),
  listingPath: "/taxonomies/group-types",
  getSlug: groupType => groupType.slug,
  layoutKind: "group-type",
  fields: groupTypeFields,
  defaultLayout: GROUP_TYPE_DEFAULT_LAYOUT,
  // Layout-driven: the body comes from `fields` + `defaultLayout`. A single tab needs no `group`, so
  // `tabs` is a thin placeholder retained only for the descriptor's type requirement.
  tabs: [
    {
      key: "general",
      label: "General",
    },
  ],
};
