import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";

import { useCategories } from "../hooks/useCategories";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryIcon } from "@/lib/icons";

export const Route = createFileRoute("/settings/more-categories")({
  component: MoreCategoriesPage,
});

function MoreCategoriesPage() {
  const { data: categories, isLoading } = useCategories();

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Categories</h2>
        <p className="text-sm text-muted-foreground">
          Browse and manage your bookmark categories.
        </p>
      </div>

      {isLoading
        ? <p className="text-sm text-muted-foreground">Loading…</p>
        : categories && categories.length > 0
          ? (
            <div
              className="
                grid grid-cols-1 gap-4
                sm:grid-cols-2
              "
            >
              {categories.map(category => (
                <Link
                  key={category.id}
                  to="/categories/$categorySlug/general"
                  params={{ categorySlug: category.slug }}
                >
                  <Card className="cursor-pointer py-4 transition-colors hover:bg-accent">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CategoryIcon
                          name={category.icon}
                          className="size-4 shrink-0"
                        />
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )
          : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">No categories yet.</p>
              <Link
                to="/categories"
                className="text-sm underline underline-offset-4"
              >
                Manage categories
              </Link>
            </div>
          )}

      {categories && categories.length > 0 && (
        <Link
          to="/categories"
          className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4"
        >
          <FolderOpen className="size-4" />
          Manage all categories
        </Link>
      )}
    </section>
  );
}
