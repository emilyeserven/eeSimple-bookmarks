import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { categoryWorkbench } from "../components/workbench/category";
import { EntityEditView } from "../components/workbench/EntityEditView";
import { useCategoryBySlug } from "../hooks/useCategories";

import { CategoryIcon } from "@/lib/icons";
import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/categories/$categorySlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: CategoryEditPage,
});

function CategoryEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    categorySlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    category, isLoading,
  } = useCategoryBySlug(categorySlug);

  return (
    <EntityEditView
      workbench={categoryWorkbench}
      slug={categorySlug}
      editTo="/categories/$categorySlug/edit"
      params={{
        categorySlug,
      }}
      activeTab={tab}
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
    />
  );
}
