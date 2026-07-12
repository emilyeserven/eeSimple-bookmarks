import type { Category, UpdateCategoryInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { useUpdateCategory } from "../hooks/useCategories";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { usePrimaryLanguageField } from "../hooks/usePrimaryLanguageField";
import { useAppForm } from "../lib/form";

import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const descriptionSchema = z.object({
  description: z.string(),
});

const NAME_LABELS: Partial<Record<keyof UpdateCategoryInput, string>> = {
  name: "Name",
};

const ICON_LABELS: Partial<Record<keyof UpdateCategoryInput, string>> = {
  icon: "Icon",
};

const DESCRIPTION_LABELS: Partial<Record<keyof UpdateCategoryInput, string>> = {
  description: "Description",
};

interface CategoryFieldProps {
  category: Category;
}

/**
 * The category's name. A standalone placeable field (the `name` field in the registry); it mounts its
 * own `useAppForm` + `useFieldAutoSave` (no cross-field coordination with icon/description — each of
 * the three saves independently, unlike bookmark's General form). Auto-saves on blur, follows the new
 * slug, and re-syncs the primary-language name value via the independent, react-query-backed
 * `usePrimaryLanguageField` hook.
 */
export function CategoryNameEditField({
  category,
}: CategoryFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateCategory = useUpdateCategory();
  const primaryLanguage = usePrimaryLanguageField("category", category.id);
  const autoSave = useFieldAutoSave<UpdateCategoryInput, Category>({
    id: category.id,
    update: updateCategory,
    labels: NAME_LABELS,
    initial: {
      name: category.name,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: category.name,
    },
    validators: {
      onChange: nameSchema,
    },
  });

  return (
    <form.AppField name="name">
      {field => (
        <field.TextField
          label={t("Name")}
          disabled={category.builtIn}
          onBlur={() => {
            const trimmed = field.state.value.trim();
            autoSave.saveField(
              "name",
              trimmed,
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug !== category.slug) {
                    void navigate({
                      to: "/categories/$categorySlug/edit",
                      params: {
                        categorySlug: updated.slug,
                      },
                    });
                  }
                },
              },
            );
            primaryLanguage.syncPrimaryValue(trimmed);
          }}
        />
      )}
    </form.AppField>
  );
}

/** The category's icon. A standalone placeable field (the `icon` field in the registry); saves on change. */
export function CategoryIconEditField({
  category,
}: CategoryFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateCategory = useUpdateCategory();
  const autoSave = useFieldAutoSave<UpdateCategoryInput, Category>({
    id: category.id,
    update: updateCategory,
    labels: ICON_LABELS,
    initial: {
      icon: category.icon,
    },
  });

  const form = useAppForm({
    defaultValues: {
      icon: category.icon,
    },
  });

  return (
    <form.AppField name="icon">
      {field => (
        <div className="space-y-1">
          <Label htmlFor={`category-icon-${category.id}`}>{t("Icon")}</Label>
          <IconPicker
            aria-label={t("Icon for {{name}}", {
              name: category.name,
            })}
            value={field.state.value}
            onChange={(value) => {
              field.handleChange(value);
              autoSave.saveField("icon", value);
            }}
          />
        </div>
      )}
    </form.AppField>
  );
}

/**
 * The category's description. A standalone placeable field (the `description` field in the registry);
 * saves on blur.
 */
export function CategoryDescriptionEditField({
  category,
}: CategoryFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateCategory = useUpdateCategory();
  const autoSave = useFieldAutoSave<UpdateCategoryInput, Category>({
    id: category.id,
    update: updateCategory,
    labels: DESCRIPTION_LABELS,
    initial: {
      description: category.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      description: category.description ?? "",
    },
    validators: {
      onChange: descriptionSchema,
    },
  });

  return (
    <form.AppField name="description">
      {field => (
        <field.TextareaField
          label={t("Description")}
          debounceSave
          onBlur={() => autoSave.saveField(
            "description",
            field.state.value.trim() || null,
            {
              valid: field.state.meta.errors.length === 0,
            },
          )}
        />
      )}
    </form.AppField>
  );
}

/**
 * The category's primary-language picker. A standalone placeable field (the `primaryLanguage` field in
 * the registry); it mounts its own `usePrimaryLanguageField` (react-query-backed, so it coordinates
 * with the name field's sync via the shared cache) and seeds a newly-set primary row with the category's
 * saved name.
 */
export function CategoryPrimaryLanguageEdit({
  category,
}: CategoryFieldProps) {
  const primaryLanguage = usePrimaryLanguageField("category", category.id);
  return (
    <PrimaryLanguageField
      value={primaryLanguage.primaryLanguageId}
      onValueChange={v => primaryLanguage.setPrimaryLanguage(v, category.name)}
    />
  );
}

/** The category's additional-names editor (the `names` field). Self-saving via `EntityNamesTabEditor`. */
export function CategoryNamesEdit({
  category,
}: CategoryFieldProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{t("Names")}</Label>
      <EntityNamesTabEditor
        ownerType="category"
        ownerId={category.id}
      />
    </div>
  );
}

interface CategoryGeneralFormProps {
  category: Category;
}

/**
 * Edit a category's name, icon, description, primary language, additional names, and genres/moods.
 * Each field auto-saves (no Save button). Composed from the same placeable sub-fields the category
 * workbench registry uses (`CategoryNameEditField` / `CategoryIconEditField` /
 * `CategoryDescriptionEditField` / `CategoryPrimaryLanguageEdit` / `CategoryNamesEdit` +
 * `GenreMoodAssignmentSection`), so this whole-form shell (still used by `CategoryCard`) stays in
 * lockstep with the layout-driven General tab.
 */
export function CategoryGeneralForm({
  category,
}: CategoryGeneralFormProps) {
  return (
    <div className="space-y-4">
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <CategoryNameEditField category={category} />
        <CategoryIconEditField category={category} />
        <CategoryDescriptionEditField category={category} />
      </div>
      <CategoryPrimaryLanguageEdit category={category} />
      <CategoryNamesEdit category={category} />
      <GenreMoodAssignmentSection
        ownerType="category"
        ownerId={category.id}
      />
    </div>
  );
}
