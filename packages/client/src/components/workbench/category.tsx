/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Category } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { CategoryCustomProperties } from "../CategoryCustomProperties";
import { CategoryGeneralForm } from "../CategoryGeneralForm";
import { CategoryGeneralFields } from "../CategoryPreviewCard";
import { EntityAutofillSources } from "../EntityAutofillSources";
import { EntityNamesTabView, PrimaryLanguageTabView } from "../entityNames/EntityNamesTab";
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
      <PrimaryLanguageTabView
        ownerType="category"
        ownerId={category.id}
      />
      <EntityNamesTabView
        ownerType="category"
        ownerId={category.id}
      />
      <EntityAutofillSources
        match={{
          kind: "category",
          categoryId: category.id,
        }}
      />
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
  notFound: i18n.t("Category not found."),
  navAriaLabel: i18n.t("Category sections"),
  listingPath: "/categories",
  getSlug: category => category.slug,
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Name, icon, description, and other details."),
        render: CategoryGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name, icon, and description."),
        render: ({
          entity,
        }) => <CategoryGeneralForm category={entity} />,
      },
    },
    {
      key: "custom-properties",
      label: i18n.t("Custom Properties"),
      view: {
        title: i18n.t("Custom Properties"),
        description: i18n.t("The custom properties this category has access to, and their default values."),
        render: ({
          entity,
        }) => <CategoryCustomProperties category={entity} />,
      },
      edit: {
        title: i18n.t("Custom Properties"),
        description: i18n.t("The custom properties this category has access to, and their default values."),
        render: ({
          entity,
        }) => <CategoryCustomProperties category={entity} />,
      },
    },
    {
      key: "display",
      label: i18n.t("Display"),
      edit: {
        title: i18n.t("Display"),
        description: i18n.t("How this category's bookmark listing is laid out."),
        render: ({
          entity,
        }) => <ListingDisplayControls pageKey={`category:${entity.slug}`} />,
      },
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      view: {
        title: i18n.t("Autofill Rules"),
        description: i18n.t("Autofill rules that set this category."),
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            categoryId={entity.id}
            query=""
          />
        ),
      },
      edit: {
        title: i18n.t("Autofill Rules"),
        description: i18n.t("Autofill rules that set this category."),
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            categoryId={entity.id}
            query=""
          />
        ),
      },
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      view: {
        title: i18n.t("Display Rules"),
        description: i18n.t("Card display rules whose conditions target this category."),
        render: ({
          entity,
        }) => <CardDisplayRulesList categoryId={entity.id} />,
      },
      edit: {
        title: i18n.t("Display Rules"),
        description: i18n.t("Card display rules whose conditions target this category."),
        render: ({
          entity,
        }) => <CardDisplayRulesList categoryId={entity.id} />,
      },
    },
  ],
};
