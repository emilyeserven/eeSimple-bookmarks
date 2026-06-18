import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout, navLinkClass } from "../components/TabbedEntityLayout";
import { useCategoryBySlug } from "../hooks/useCategories";

import { CategoryIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/categories/$categorySlug/edit")({
  component: CategoryEditLayout,
});

const editNav = [
  {
    to: "/categories/$categorySlug/edit/general",
    label: "General",
  },
  {
    to: "/categories/$categorySlug/edit/tiered-tags",
    label: "Tiered Tags",
  },
  {
    to: "/categories/$categorySlug/edit/custom-properties",
    label: "Custom Properties",
  },
  {
    to: "/categories/$categorySlug/edit/autofill",
    label: "Autofill Rules",
  },
] as const;

function CategoryEditLayout() {
  const {
    categorySlug,
  } = Route.useParams();
  const {
    category, isLoading,
  } = useCategoryBySlug(categorySlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/categories/$categorySlug"
            params={{
              categorySlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to category
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <CategoryIcon
              name={category?.icon ?? null}
              className="size-6"
            />
            {isLoading ? "Edit category" : (category?.name ?? "Category not found")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Edit this category, its tiered tags, custom properties, and autofill rules.
          </p>
        </div>
      )}
      nav={(
        <nav
          className="
            flex shrink-0 flex-col gap-1
            sm:w-48
          "
          aria-label="Category settings sections"
        >
          {editNav.map(item => (
            <Link
              key={item.to}
              to={item.to}
              params={{
                categorySlug,
              }}
              className={cn(navLinkClass)}
              activeProps={{
                className: "bg-accent text-accent-foreground",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    />
  );
}
