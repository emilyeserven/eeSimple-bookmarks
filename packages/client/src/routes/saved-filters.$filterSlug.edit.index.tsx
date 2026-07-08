import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { savedFilterWorkbench } from "../components/workbench/savedFilter";
import { useDeleteSavedFilter, useSavedFilterBySlug } from "../hooks/useSavedFilters";

import { Button } from "@/components/ui/button";
import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/saved-filters/$filterSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: SavedFilterEditPage,
});

function SavedFilterEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    filterSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    savedFilter, isLoading,
  } = useSavedFilterBySlug(filterSlug);
  const deleteFilter = useDeleteSavedFilter();

  return (
    <EntityEditView
      workbench={savedFilterWorkbench}
      slug={filterSlug}
      editTo="/saved-filters/$filterSlug/edit"
      params={{
        filterSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/saved-filters/$filterSlug/info"
            params={{
              filterSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to saved filter")}
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? t("Edit saved filter") : (savedFilter?.name ?? t("Saved filter not found"))}
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
                  {deleteFilter.isPending ? t("Deleting…") : t("Delete")}
                </Button>
              )
              : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("Edit the name, description, and sidebar visibility for this filter.")}
          </p>
        </div>
      )}
    />
  );
}
