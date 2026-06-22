/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Category } from "@eesimple/types";

import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { CategoryCustomProperties } from "../CategoryCustomProperties";
import { CategoryGeneralForm } from "../CategoryGeneralForm";
import { CategoryGeneralFields } from "../CategoryPreviewCard";
import { CategoryTieredTags } from "../CategoryTieredTags";
import { EntityAutofillSources } from "../EntityAutofillSources";
import { ListingDisplayControls } from "../ListingDisplayControls";

import { useCategories, useCategoryBySlug, useDeleteCategory } from "@/hooks/useCategories";

function CategoryGeneralView({
  entity: category,
}: {
  entity: Category;
}) {
  return (
    <div className="space-y-6">
      <CategoryGeneralFields category={category} />
      <EntityAutofillSources
        match={{
          kind: "category",
          categoryId: category.id,
        }}
      />
    </div>
  );
}

function CategoryAutofillView({
  entity: category,
}: {
  entity: Category;
}) {
  return (
    <div className="space-y-6">
      <EntityAutofillSources
        match={{
          kind: "category",
          categoryId: category.id,
        }}
      />
      <AutofillRulesList categoryId={category.id} />
    </div>
  );
}

/** Single source of truth for a category's tabbed view/edit UI (main pane routes + right panel). */
export const categoryWorkbench: EntityWorkbench<Category> = {
  useBySlug: (slug) => {
    const {
      category, isLoading,
    } = useCategoryBySlug(slug);
    return {
      entity: category,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useCategories();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: category => category.name,
  isBuiltIn: category => category.builtIn,
  useDelete: () => {
    const mutation = useDeleteCategory();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Category not found.",
  navAriaLabel: "Category sections",
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name, icon, description, and other details.",
        render: CategoryGeneralView,
      },
      edit: {
        title: "General",
        description: "Name, icon, and description.",
        render: ({
          entity,
        }) => <CategoryGeneralForm category={entity} />,
      },
    },
    {
      key: "tiered-tags",
      label: "Tiered Tags",
      view: {
        title: "Tiered Tags",
        description: "Tiered (parent) tags scoped to this category.",
        render: ({
          entity,
        }) => <CategoryTieredTags categoryId={entity.id} />,
      },
      edit: {
        title: "Tiered Tags",
        description: "Tiered (parent) tags scoped to this category.",
        render: ({
          entity,
        }) => <CategoryTieredTags categoryId={entity.id} />,
      },
    },
    {
      key: "custom-properties",
      label: "Custom Properties",
      view: {
        title: "Custom Properties",
        description: "The custom properties this category has access to, and their default values.",
        render: ({
          entity,
        }) => <CategoryCustomProperties category={entity} />,
      },
      edit: {
        title: "Custom Properties",
        description: "The custom properties this category has access to, and their default values.",
        render: ({
          entity,
        }) => <CategoryCustomProperties category={entity} />,
      },
    },
    {
      key: "autofill",
      label: "Autofill Rules",
      view: {
        title: "Autofill Rules",
        description: "Autofill rules that add matching bookmarks to this category.",
        render: CategoryAutofillView,
      },
      edit: {
        title: "Autofill Rules",
        description: "Autofill rules that add matching bookmarks to this category. New rules created here target this category by default.",
        render: CategoryAutofillView,
      },
    },
    {
      key: "display-rules",
      label: "Display Rules",
      view: {
        title: "Display Rules",
        description: "Card display rules whose conditions match this category.",
        render: ({
          entity,
        }) => <CardDisplayRulesList categoryId={entity.id} />,
      },
      edit: {
        title: "Display Rules",
        description: "Card display rules whose conditions match this category. New rules created here match this category by default.",
        render: ({
          entity,
        }) => <CardDisplayRulesList categoryId={entity.id} />,
      },
    },
    {
      key: "display",
      label: "Display",
      edit: {
        title: "Display",
        description: "How this category's bookmark listing is laid out.",
        render: ({
          entity,
        }) => <ListingDisplayControls pageKey={`category:${entity.slug}`} />,
      },
    },
  ],
};
