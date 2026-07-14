/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, SavedFilter } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import i18n from "../../i18n";
import {
  SavedFilterDescriptionEditField,
  SavedFilterFiltersField,
  SavedFilterNameEditField,
  SavedFilterViewableOnlineEditField,
} from "../SavedFilterGeneralForm";

import { DetailField } from "@/components/DetailField";
import { useDeleteSavedFilter, useSavedFilterBySlug, useSavedFilters } from "@/hooks/useSavedFilters";
import { summarizeBookmarkSearch } from "@/lib/bookmarkSearch";

interface SavedFilterViewProps {
  filter: SavedFilter;
}

/** The description paragraph — self-hiding when empty. */
function SavedFilterDescriptionView({
  filter,
}: SavedFilterViewProps) {
  return filter.description
    ? <p className="text-sm text-muted-foreground">{filter.description}</p>
    : null;
}

/** "Filters" (summary) row. */
function SavedFilterFiltersView({
  filter,
}: SavedFilterViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Filters")}>{summarizeBookmarkSearch(filter.filters)}</DetailField>;
}

/** "Sidebar shortcut" (Yes/No) row. */
function SavedFilterSidebarShortcutView({
  filter,
}: SavedFilterViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Sidebar shortcut")}>{filter.viewableOnline ? t("Yes") : t("No")}</DetailField>;
}

/** "Slug" row (monospace), with an em-dash fallback so the row always shows. */
function SavedFilterSlugView({
  filter,
}: SavedFilterViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Slug")}>
      <span className="font-mono">{filter.slug ?? "—"}</span>
    </DetailField>
  );
}

/** "Added" (created date) row. */
function SavedFilterAddedView({
  filter,
}: SavedFilterViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Added")}>{new Date(filter.createdAt).toLocaleDateString()}</DetailField>;
}

/**
 * The saved-filter workbench's field registry (#1106 layout editor). The old single `general` composite
 * is fully atomized (#1371, following the media-type #1189 reference) into per-field, mode-aware
 * {@link WorkbenchField}s so an operator can place each independently in **Settings → Page Layouts**. Each
 * edit field owns its own single-field `useAppForm` + `useFieldAutoSave` — no form-context provider
 * needed (the Category precedent). `name` is **edit-only**; `slug`/`added` are **view-only**;
 * `description`/`filters`/`viewableOnline` carry both. Authored as an exhaustive
 * `Record<SavedFilterFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type SavedFilterFieldKey
  = | "name"
    | "description"
    | "filters"
    | "viewableOnline"
    | "slug"
    | "added";

const savedFilterFields = {
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: ({
      entity,
    }) => <SavedFilterNameEditField filter={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: ({
      entity,
    }) => <SavedFilterDescriptionView filter={entity} />,
    edit: ({
      entity,
    }) => <SavedFilterDescriptionEditField filter={entity} />,
  },
  filters: {
    key: "filters",
    label: i18n.t("Filters"),
    view: ({
      entity,
    }) => <SavedFilterFiltersView filter={entity} />,
    edit: ({
      entity,
    }) => <SavedFilterFiltersField filter={entity} />,
  },
  viewableOnline: {
    key: "viewableOnline",
    label: i18n.t("Sidebar shortcut"),
    view: ({
      entity,
    }) => <SavedFilterSidebarShortcutView filter={entity} />,
    edit: ({
      entity,
    }) => <SavedFilterViewableOnlineEditField filter={entity} />,
  },
  slug: {
    key: "slug",
    label: i18n.t("Slug"),
    view: ({
      entity,
    }) => <SavedFilterSlugView filter={entity} />,
  },
  added: {
    key: "added",
    label: i18n.t("Added"),
    view: ({
      entity,
    }) => <SavedFilterAddedView filter={entity} />,
  },
} satisfies Record<SavedFilterFieldKey, WorkbenchField<SavedFilter>>;

/**
 * The code default layout: one General tab, one untitled section listing every atomized field in one
 * per-mode-sensible order — the edit-visible subset (`name`/`description`/`filters`/`viewableOnline`)
 * reproduces the pre-#1371 form order, and the view-visible subset
 * (`description`/`filters`/`viewableOnline`/`slug`/`added`) reproduces the pre-#1371 view order.
 */
const SAVED_FILTER_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["name", "description", "filters", "viewableOnline", "slug", "added"] satisfies SavedFilterFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a saved filter's view/edit UI (main pane routes + right panel). */
export const savedFilterWorkbench: EntityWorkbench<SavedFilter> = {
  useBySlug: (slug) => {
    const {
      savedFilter, isLoading,
    } = useSavedFilterBySlug(slug);
    return {
      entity: savedFilter,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useSavedFilters();
    return {
      entity: (data ?? []).find(f => f.id === id),
      isLoading,
      error: error ?? null,
    };
  },
  name: filter => filter.name,
  useDelete: () => {
    const mutation = useDeleteSavedFilter();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Saved filter not found."),
  navAriaLabel: i18n.t("Saved filter sections"),
  getSlug: filter => filter.slug,
  layoutKind: "saved-filter",
  fields: savedFilterFields,
  defaultLayout: SAVED_FILTER_DEFAULT_LAYOUT,
  // Layout-driven: the body comes from `fields` + `defaultLayout`. A single tab needs no `group`, so
  // `tabs` is a thin placeholder retained only for the descriptor's type requirement.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
  ],
};
