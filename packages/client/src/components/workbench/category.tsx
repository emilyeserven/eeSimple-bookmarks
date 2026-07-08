import type { EntityWorkbench, WorkbenchField } from "./types";
import type { Category, EntityLayout } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { CategoryCustomProperties } from "../CategoryCustomProperties";
import {
  CategoryDetailsFields,
  CategoryNamesEdit,
  CategoryPrimaryLanguageEdit,
} from "../CategoryGeneralForm";
import { CategoryGeneralFields } from "../CategoryPreviewCard";
import { EntityAutofillSources } from "../EntityAutofillSources";
import { EntityNamesTabView, PrimaryLanguageTabView } from "../entityNames/EntityNamesTab";
import { GenreMoodAssignmentSection } from "../GenreMoodAssignmentSection";
import { ListingDisplayControls } from "../ListingDisplayControls";

import { useCategories, useCategoryBySlug, useDeleteCategory } from "@/hooks/useCategories";

/**
 * The category workbench's field registry (#1106 layout editor). Every JSX block that used to live in
 * the opaque `general` panes plus each specialized tab is a placeable, mode-aware {@link WorkbenchField}
 * here; the resolved `EntityLayout` (see {@link CATEGORY_DEFAULT_LAYOUT}) arranges them into tabs. The
 * mode picks the `view`/`edit` renderer, so view/edit parity is by construction:
 * - `genreMoods` is **edit-only** (no view) and `autofillSources` **view-only** (no edit) — that is how
 *   the asymmetric General view/edit reconcile into one ordered field list;
 * - `display` is **edit-only** → its tab vanishes in view (the old edit-only "Display" tab);
 * - `name`/`icon`/`description` stay one `details` field (shared `useAppForm` + a two-column grid — one
 *   cohesive layout unit).
 * Authored as an exhaustive `Record<CategoryFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type CategoryFieldKey
  = | "details"
    | "primaryLanguage"
    | "names"
    | "genreMoods"
    | "autofillSources"
    | "customProperties"
    | "display"
    | "autofillRules"
    | "displayRules";

const categoryFields = {
  details: {
    key: "details",
    label: i18n.t("General"),
    view: ({
      entity,
    }) => <CategoryGeneralFields category={entity} />,
    edit: ({
      entity,
    }) => <CategoryDetailsFields category={entity} />,
  },
  primaryLanguage: {
    key: "primaryLanguage",
    label: i18n.t("Primary language"),
    view: ({
      entity,
    }) => (
      <PrimaryLanguageTabView
        ownerType="category"
        ownerId={entity.id}
      />
    ),
    edit: ({
      entity,
    }) => <CategoryPrimaryLanguageEdit category={entity} />,
  },
  names: {
    key: "names",
    label: i18n.t("Names"),
    view: ({
      entity,
    }) => (
      <EntityNamesTabView
        ownerType="category"
        ownerId={entity.id}
      />
    ),
    edit: ({
      entity,
    }) => <CategoryNamesEdit category={entity} />,
  },
  genreMoods: {
    key: "genreMoods",
    label: i18n.t("Genres & moods"),
    edit: ({
      entity,
    }) => (
      <GenreMoodAssignmentSection
        ownerType="category"
        ownerId={entity.id}
      />
    ),
  },
  autofillSources: {
    key: "autofillSources",
    label: i18n.t("Autofill sources"),
    view: ({
      entity,
    }) => (
      <EntityAutofillSources
        match={{
          kind: "category",
          categoryId: entity.id,
        }}
      />
    ),
  },
  customProperties: {
    key: "customProperties",
    label: i18n.t("Custom Properties"),
    view: ({
      entity,
    }) => <CategoryCustomProperties category={entity} />,
    edit: ({
      entity,
    }) => <CategoryCustomProperties category={entity} />,
  },
  display: {
    key: "display",
    label: i18n.t("Display"),
    edit: ({
      entity,
    }) => <ListingDisplayControls pageKey={`category:${entity.slug}`} />,
  },
  autofillRules: {
    key: "autofillRules",
    label: i18n.t("Autofill Rules"),
    view: ({
      entity,
    }) => (
      <AutofillRulesList
        categoryId={entity.id}
        query=""
      />
    ),
    edit: ({
      entity,
    }) => (
      <AutofillRulesList
        categoryId={entity.id}
        query=""
      />
    ),
  },
  displayRules: {
    key: "displayRules",
    label: i18n.t("Display Rules"),
    view: ({
      entity,
    }) => <CardDisplayRulesList categoryId={entity.id} />,
    edit: ({
      entity,
    }) => <CardDisplayRulesList categoryId={entity.id} />,
  },
} satisfies Record<CategoryFieldKey, WorkbenchField<Category>>;

/**
 * The code-defined default layout — the current tab list, one untitled section per tab, fields in
 * current render order, so a deploy with no stored override renders byte-identically to before the
 * migration (modulo the layout-driven path's dropped tab `<h2>` header). Tab keys match the `tabs`
 * array so the "Rules" edit-nav grouping is re-attached by key.
 */
const CATEGORY_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["details", "primaryLanguage", "names", "genreMoods", "autofillSources"] satisfies CategoryFieldKey[],
      }],
    },
    {
      key: "custom-properties",
      label: i18n.t("Custom Properties"),
      sections: [{
        key: "custom-properties",
        fields: ["customProperties"] satisfies CategoryFieldKey[],
      }],
    },
    {
      key: "display",
      label: i18n.t("Display"),
      sections: [{
        key: "display",
        fields: ["display"] satisfies CategoryFieldKey[],
      }],
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      sections: [{
        key: "autofill",
        fields: ["autofillRules"] satisfies CategoryFieldKey[],
      }],
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      sections: [{
        key: "display-rules",
        fields: ["displayRules"] satisfies CategoryFieldKey[],
      }],
    },
  ],
};

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
  layoutKind: "category",
  fields: categoryFields,
  defaultLayout: CATEGORY_DEFAULT_LAYOUT,
  // Layout-driven: the tab rail + section stacks come from `fields` + `defaultLayout`, not from these
  // panes. `tabs` is retained only to carry the code-only `group` nav metadata (the "Rules" More
  // dropdown on the edit strip), re-attached by tab key in `deriveWorkbenchTabs`; the panes are gone.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "custom-properties",
      label: i18n.t("Custom Properties"),
    },
    {
      key: "display",
      label: i18n.t("Display"),
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      group: i18n.t("Rules"),
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      group: i18n.t("Rules"),
    },
  ],
};
