import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useCategoryBySlug } from "../hooks/useCategories";

import { CategoryIcon } from "@/lib/icons";

export const Route = createFileRoute("/categories/$categorySlug/edit")({
  component: CategoryEditLayout,
});

function CategoryEditLayout() {
  const {
    t,
  } = useTranslation();
  const editNav = [
    {
      to: "/categories/$categorySlug/edit/general",
      label: t("General"),
    },
    {
      to: "/categories/$categorySlug/edit/tiered-tags",
      label: t("Tiered Tags"),
    },
    {
      to: "/categories/$categorySlug/edit/custom-properties",
      label: t("Custom Properties"),
    },
    {
      to: "/categories/$categorySlug/edit/display",
      label: t("Display"),
    },
    {
      type: "group",
      label: t("Rules"),
      items: [
        {
          to: "/categories/$categorySlug/edit/autofill",
          label: t("Autofill Rules"),
        },
        {
          to: "/categories/$categorySlug/edit/display-rules",
          label: t("Display Rules"),
        },
      ],
    },
  ] as const;
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
            to="/categories/$categorySlug/info"
            params={{
              categorySlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to category")}
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <CategoryIcon
              name={category?.icon ?? null}
              className="size-6"
            />
            {isLoading ? t("Edit category") : (category?.name ?? t("Category not found"))}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("Edit this category, its tiered tags, custom properties, and autofill rules.")}
          </p>
        </div>
      )}
      nav={editNav}
      params={{
        categorySlug,
      }}
      navAriaLabel={t("Category settings sections")}
    />
  );
}
