import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { useCategoryBySlug } from "../hooks/useCategories";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";

/**
 * The category listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/categories/$categorySlug/_hub")({
  component: CategoryHubLayout,
});

function CategoryHubLayout() {
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
    <ListingHubLayout
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
              <LocalizedNameLabel
                names={category.names ?? []}
                base={category.name}
              />
            )
            : (isLoading ? t("Category") : t("Category not found"))}
          {category?.builtIn ? <Badge variant="secondary">{t("Built-in")}</Badge> : null}
        </h1>
      )}
      tabs={[
        {
          to: "/categories/$categorySlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/categories/$categorySlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/categories/$categorySlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        categorySlug,
      }}
      navAriaLabel={t("Category views")}
    />
  );
}
