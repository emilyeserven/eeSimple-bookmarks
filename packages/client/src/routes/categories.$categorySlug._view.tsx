import { Link, createFileRoute, useRouterState } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useCategoryBySlug, useDeleteCategory } from "../hooks/useCategories";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/lib/icons";

export const Route = createFileRoute("/categories/$categorySlug/_view")({
  component: CategoryViewLayout,
});

const VIEW_TO_EDIT = {
  "general": "/categories/$categorySlug/edit/general",
  "tiered-tags": "/categories/$categorySlug/edit/tiered-tags",
  "custom-properties": "/categories/$categorySlug/edit/custom-properties",
  "autofill": "/categories/$categorySlug/edit/autofill",
  "display-rules": "/categories/$categorySlug/edit/display-rules",
} as const;
type CategoryEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

const viewNav = [
  {
    to: "/categories/$categorySlug/general",
    label: "General",
  },
  {
    to: "/categories/$categorySlug/tiered-tags",
    label: "Tiered Tags",
  },
  {
    to: "/categories/$categorySlug/custom-properties",
    label: "Custom Properties",
  },
  {
    to: "/categories/$categorySlug/autofill",
    label: "Autofill Rules",
  },
  {
    to: "/categories/$categorySlug/display-rules",
    label: "Display Rules",
  },
] as const;

function CategoryViewLayout() {
  const {
    categorySlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const pathname = useRouterState({
    select: s => s.location.pathname,
  });
  const editRoute: CategoryEditRoute = (VIEW_TO_EDIT[pathname.split("/").at(-1) as keyof typeof VIEW_TO_EDIT] ?? VIEW_TO_EDIT.general) as CategoryEditRoute;
  const {
    category, isLoading,
  } = useCategoryBySlug(categorySlug);
  const deleteCategory = useDeleteCategory();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/categories"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to categories
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              <CategoryIcon
                name={category?.icon ?? null}
                className="size-6 shrink-0"
              />
              {isLoading ? "Category" : (category?.name ?? "Category not found")}
              {category?.builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
            </h1>
            {category
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
                        categorySlug,
                      }}
                    >
                      Edit
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
                    disabled={deleteCategory.isPending}
                    onClick={() => deleteCategory.mutate(category.id, {
                      onSuccess: () => navigate({
                        to: "/categories",
                      }),
                    })}
                  >
                    {deleteCategory.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        categorySlug,
      }}
      navAriaLabel="Category sections"
    />
  );
}
