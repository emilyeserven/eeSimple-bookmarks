import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { useCategory } from "../hooks/useCategories";

import { CategoryIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/categories/$categoryId/edit")({
  component: CategoryEditLayout,
});

const editNav = [
  {
    to: "/categories/$categoryId/edit/general",
    label: "General",
  },
  {
    to: "/categories/$categoryId/edit/tiered-tags",
    label: "Tiered Tags",
  },
  {
    to: "/categories/$categoryId/edit/custom-properties",
    label: "Custom Properties",
  },
  {
    to: "/categories/$categoryId/edit/autofill",
    label: "Autofill",
  },
] as const;

const navLinkClass = `
  rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors
  hover:bg-accent hover:text-accent-foreground
`;

function CategoryEditLayout() {
  const {
    categoryId,
  } = Route.useParams();
  const {
    category, isLoading,
  } = useCategory(categoryId);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <Link
          to="/categories/$categoryId"
          params={{
            categoryId,
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

      <div
        className="
          flex flex-col gap-6
          sm:flex-row
        "
      >
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
                categoryId,
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

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
