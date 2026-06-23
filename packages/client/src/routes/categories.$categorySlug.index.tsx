import * as React from "react";

import { createFileRoute } from "@tanstack/react-router";

import { useCategories } from "../hooks/useCategories";

export const Route = createFileRoute("/categories/$categorySlug/")({
  component: CategoryPageRedirect,
});

function CategoryPageRedirect() {
  const {
    categorySlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    data: categories, isLoading,
  } = useCategories();

  const category = (categories ?? []).find(item => item.slug === categorySlug);

  React.useEffect(() => {
    if (category) {
      void navigate({
        to: "/bookmarks",
        search: {
          categories: [category.id],
        },
        replace: true,
      });
    }
  }, [category, navigate]);

  if (isLoading) return null;
  if (!category) return <p className="text-destructive">Category not found.</p>;
  return null;
}
