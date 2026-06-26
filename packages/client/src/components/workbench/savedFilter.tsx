/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { SavedFilter } from "@eesimple/types";

import { Globe } from "lucide-react";

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
        <dt className="text-muted-foreground">Filters</dt>
        <dd>{summarizeBookmarkSearch(filter.filters)}</dd>
        <dt className="flex items-center gap-1 text-muted-foreground">
          <Globe className="size-3.5" />
          Sidebar shortcut
        </dt>
        <dd>{filter.viewableOnline ? "Yes" : "No"}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{filter.slug ?? "—"}</dd>
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(filter.createdAt).toLocaleDateString()}</dd>
      </dl>
    </div>
  );
}

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
  notFound: "Saved filter not found.",
  navAriaLabel: "Saved filter sections",
  getSlug: filter => filter.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Filter summary and sidebar settings.",
        render: SavedFilterGeneralView,
      },
      edit: {
        title: "General",
        description: "Name, description, and sidebar visibility.",
        render: ({
          entity,
        }) => <SavedFilterGeneralForm filter={entity} />,
      },
    },
  ],
};
