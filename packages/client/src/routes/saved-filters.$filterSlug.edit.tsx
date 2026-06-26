import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteSavedFilter, useSavedFilterBySlug } from "../hooks/useSavedFilters";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/saved-filters/$filterSlug/edit")({
  component: SavedFilterEditLayout,
});

const editNav = [
  {
    to: "/saved-filters/$filterSlug/edit/general",
    label: "General",
  },
] as const;

function SavedFilterEditLayout() {
  const {
    filterSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    savedFilter, isLoading,
  } = useSavedFilterBySlug(filterSlug);
  const deleteFilter = useDeleteSavedFilter();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/saved-filters/$filterSlug/general"
            params={{
              filterSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to saved filter
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? "Edit saved filter" : (savedFilter?.name ?? "Saved filter not found")}
            </h1>
            {savedFilter
              ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="
                    shrink-0 text-destructive
                    hover:text-destructive
                  "
                  disabled={deleteFilter.isPending}
                  onClick={() => deleteFilter.mutate(savedFilter.id, {
                    onSuccess: () => navigate({
                      to: "/saved-filters",
                    }),
                  })}
                >
                  {deleteFilter.isPending ? "Deleting…" : "Delete"}
                </Button>
              )
              : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Edit the name, description, and sidebar visibility for this filter.
          </p>
        </div>
      )}
      nav={editNav}
      params={{
        filterSlug,
      }}
      navAriaLabel="Saved filter edit sections"
    />
  );
}
