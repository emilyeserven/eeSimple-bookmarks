/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, SavedFilter } from "@eesimple/types";

import { Globe } from "lucide-react";

import i18n from "../../i18n";
import { SavedFilterGeneralForm } from "../SavedFilterGeneralForm";

import { useDeleteSavedFilter, useSavedFilterBySlug, useSavedFilters } from "@/hooks/useSavedFilters";
import { summarizeBookmarkSearch } from "@/lib/bookmarkSearch";

function SavedFilterGeneralView({
  entity: filter,
}: {
  entity: SavedFilter;
}) {
  return (
    <div className="space-y-4">
      {filter.description
        ? <p className="text-sm text-muted-foreground">{filter.description}</p>
        : null}
      <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{i18n.t("Filters")}</dt>
        <dd>{summarizeBookmarkSearch(filter.filters)}</dd>
        <dt className="flex items-center gap-1 text-muted-foreground">
          <Globe className="size-3.5" />
          {i18n.t("Sidebar shortcut")}
        </dt>
        <dd>{filter.viewableOnline ? i18n.t("Yes") : i18n.t("No")}</dd>
        <dt className="text-muted-foreground">{i18n.t("Slug")}</dt>
        <dd className="font-mono">{filter.slug ?? "—"}</dd>
        <dt className="text-muted-foreground">{i18n.t("Added")}</dt>
        <dd>{new Date(filter.createdAt).toLocaleDateString()}</dd>
      </dl>
    </div>
  );
}

/**
 * The saved-filter workbench's field registry (#1106 layout editor). The single `general` pane
 * becomes ONE placeable, mode-aware {@link WorkbenchField} keyed by the tab's own key — the
 * composite-editor recipe (#1165). Authored as an exhaustive `Record<SavedFilterFieldKey, …>` so a
 * key without a renderer fails `tsc`.
 */
type SavedFilterFieldKey = "general";

const savedFilterFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: SavedFilterGeneralView,
    edit: ({
      entity,
    }) => <SavedFilterGeneralForm filter={entity} />,
  },
} satisfies Record<SavedFilterFieldKey, WorkbenchField<SavedFilter>>;

/** The code default layout: the single General tab, one untitled section. */
const SAVED_FILTER_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies SavedFilterFieldKey[],
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
