import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Category, UpdateCategoryInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { CategoriesTable } from "../components/CategoriesTable";
import { CategoryPreviewRow } from "../components/CategoryPreviewRow";
import { CategorySortToggle } from "../components/CategorySortToggle";
import { categoryWorkbench } from "../components/workbench/category";
import { useBulkDeleteCategories, useCategories } from "../hooks/useCategories";
import { useCategorySortedItems } from "../hooks/useCategoryListing";
import i18n from "../i18n";
import { categoriesApi } from "../lib/api/taxonomies";

const CATEGORIES_PAGE_KEY = "categories-listing";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const CATEGORY_ROUTE: EntityRoute = {
  kind: "category",
  prefix: "/categories",
  slugIndex: 1,
  listLabel: i18n.t("Categories"),
  singular: i18n.t("Category"),
  switcher: "category",
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const CATEGORY_PALETTE: EntityPaletteConfig = {
  queryKey: ["categories"],
  listFn: () => categoriesApi.list(),
  updateFn: (id, patch) => categoriesApi.update(id, patch as UpdateCategoryInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
  fields: [
    {
      type: "boolean",
      key: "isHomepage",
      label: i18n.t("Homepage Category"),
      getValue: entity => (entity as Category).isHomepage,
    },
  ],
};

export const categoryListingConfig: EntityListingConfig<Category> = {
  pageKey: CATEGORIES_PAGE_KEY,
  useItems: useCategories,
  useSortedItems: useCategorySortedItems,
  renderSearchSort: () => <CategorySortToggle />,
  matches: (category, query) => category.name.toLowerCase().includes(query)
    || (category.description ?? "").toLowerCase().includes(query),
  deletableIds: items => items.filter(c => !c.builtIn).map(c => c.id),
  isSelectable: category => !category.builtIn,
  useBulkDelete: useBulkDeleteCategories,
  noun: [i18n.t("category"), i18n.t("categories")],
  loadingLabel: i18n.t("Loading categories…"),
  entityPlural: i18n.t("categories"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No categories yet.")}
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <CategoryPreviewRow
      category={entity}
      {...rest}
    />
  ),
  renderTable: function CategoryTable({
    entities, selection,
  }) {
    const navigate = useNavigate();
    return (
      <CategoriesTable
        data={entities}
        selection={selection}
        onView={(slug) => {
          void navigate({
            to: "/categories/$categorySlug",
            params: {
              categorySlug: slug,
            },
          });
        }}
        onEdit={(slug) => {
          void navigate({
            to: "/categories/$categorySlug/edit",
            params: {
              categorySlug: slug,
            },
          });
        }}
      />
    );
  },
};

/** Eighth `EntityDescriptor` migration (after Group #868, Person #872, PropertyGroup #873,
 * Newsletter #874, RelationshipType + SavedFilter #875, Website #880) — issue #860. */
export const categoryDescriptor: EntityDescriptor<Category> = {
  kind: "category",
  route: CATEGORY_ROUTE,
  palette: CATEGORY_PALETTE,
  workbench: categoryWorkbench,
  listing: categoryListingConfig,
};
