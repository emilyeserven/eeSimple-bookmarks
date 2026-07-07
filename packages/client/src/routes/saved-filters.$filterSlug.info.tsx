import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { savedFilterWorkbench } from "../components/workbench/savedFilter";
import { useDeleteSavedFilter, useSavedFilterBySlug } from "../hooks/useSavedFilters";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/saved-filters/$filterSlug/info")({
  validateSearch: validateInfoTabSearch,
  component: SavedFilterInfoTab,
});

function SavedFilterInfoTab() {
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
    <EntityInfoView
      workbench={savedFilterWorkbench}
      slug={filterSlug}
      infoTo="/saved-filters/$filterSlug/info"
      params={{
        filterSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/saved-filters"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to saved filters")}
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? t("Saved filter") : (savedFilter?.name ?? t("Saved filter not found"))}
            </h1>
            {savedFilter
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/saved-filters/$filterSlug/edit"
                      params={{
                        filterSlug,
                      }}
                      search={{
                        tab,
                      }}
                    >
                      {t("Edit")}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="
                      text-destructive
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
                </div>
              )
              : null}
          </div>
        </div>
      )}
    />
  );
}
