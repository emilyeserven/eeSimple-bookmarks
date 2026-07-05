import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useCategoryBySlug } from "../hooks/useCategories";
import i18n from "../i18n";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";

export const Route = createFileRoute("/categories/$categorySlug/_view")({
  component: CategoryViewLayout,
});

const viewNav = [
  {
    to: "/categories/$categorySlug/general",
    label: i18n.t("General"),
  },
  {
    to: "/categories/$categorySlug/tiered-tags",
    label: i18n.t("Tiered Tags"),
  },
  {
    to: "/categories/$categorySlug/custom-properties",
    label: i18n.t("Custom Properties"),
  },
  {
    type: "group",
    label: i18n.t("Rules"),
    items: [
      {
        to: "/categories/$categorySlug/autofill",
        label: i18n.t("Autofill Rules"),
      },
      {
        to: "/categories/$categorySlug/display-rules",
        label: i18n.t("Display Rules"),
      },
    ],
  },
] as const;

function CategoryViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    categorySlug,
  } = Route.useParams();
  const {
    category, isLoading,
  } = useCategoryBySlug(categorySlug);

  return (
    <TabbedEntityLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          <CategoryIcon
            name={category?.icon ?? null}
            className="size-6 shrink-0"
          />
          {category
            ? (
              <RomanizedLabel
                name={category.name}
                romanized={category.romanizedName}
              />
            )
            : (isLoading ? t("Category") : t("Category not found"))}
          {category?.builtIn ? <Badge variant="secondary">{t("Built-in")}</Badge> : null}
        </h1>
      )}
      nav={viewNav}
      params={{
        categorySlug,
      }}
      navAriaLabel={t("Category sections")}
    />
  );
}
