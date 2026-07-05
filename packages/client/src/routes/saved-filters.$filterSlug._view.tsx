import { Link, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteSavedFilter, useSavedFilterBySlug } from "../hooks/useSavedFilters";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/saved-filters/$filterSlug/_view")({
  component: SavedFilterViewLayout,
});

const VIEW_TO_EDIT = {
  general: "/saved-filters/$filterSlug/edit/general",
} as const;
type SavedFilterEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

const viewNav = [
  {
    to: "/saved-filters/$filterSlug/general",
    label: "General",
  },
] as const;

function SavedFilterViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    filterSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const pathname = useRouterState({
    select: s => s.location.pathname,
  });
  const editRoute: SavedFilterEditRoute = (
    VIEW_TO_EDIT[pathname.split("/").at(-1) as keyof typeof VIEW_TO_EDIT]
    ?? VIEW_TO_EDIT.general
  ) as SavedFilterEditRoute;
  const {
    savedFilter, isLoading,
  } = useSavedFilterBySlug(filterSlug);
  const deleteFilter = useDeleteSavedFilter();
  const nav = viewNav.map(item => ({
    ...item,
    label: t(item.label),
  }));

  return (
    <TabbedEntityLayout
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
                      to={editRoute}
                      params={{
                        filterSlug,
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
      nav={nav}
      params={{
        filterSlug,
      }}
      navAriaLabel={t("Saved filter sections")}
    />
  );
}
