import type { SavedFilter, UpdateSavedFilterInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateSavedFilter } from "../hooks/useSavedFilters";
import { summarizeBookmarkSearch } from "../lib/bookmarkSearch";
import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const descriptionSchema = z.object({
  description: z.string(),
});

const NAME_LABELS: Partial<Record<keyof UpdateSavedFilterInput, string>> = {
  name: "Name",
};

const DESCRIPTION_LABELS: Partial<Record<keyof UpdateSavedFilterInput, string>> = {
  description: "Description",
};

const VIEWABLE_ONLINE_LABELS: Partial<Record<keyof UpdateSavedFilterInput, string>> = {
  viewableOnline: "Viewable online",
};

interface SavedFilterFieldProps {
  filter: SavedFilter;
}

/**
 * The saved filter's name. A standalone placeable field (the `name` field in the registry); it mounts its
 * own `useAppForm` + `useFieldAutoSave` (no cross-field coordination — the Category #1186 precedent).
 * Auto-saves on blur and follows the new slug.
 */
export function SavedFilterNameEditField({
  filter,
}: SavedFilterFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateFilter = useUpdateSavedFilter();
  const autoSave = useFieldAutoSave<UpdateSavedFilterInput, SavedFilter>({
    id: filter.id,
    update: updateFilter,
    labels: NAME_LABELS,
    initial: {
      name: filter.name,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: filter.name,
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
          onBlur={() => autoSave.saveField(
            "name",
            field.state.value.trim(),
            {
              valid: field.state.meta.errors.length === 0,
              onSuccess: (updated) => {
                if (updated.slug !== filter.slug) {
                  void navigate({
                    to: "/saved-filters/$filterSlug/edit",
                    params: {
                      filterSlug: updated.slug ?? filter.slug ?? "",
                    },
                  });
                }
              },
            },
          )}
        />
      )}
    </form.AppField>
  );
}

/** The saved filter's description. A standalone placeable field; saves on blur. */
export function SavedFilterDescriptionEditField({
  filter,
}: SavedFilterFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateFilter = useUpdateSavedFilter();
  const autoSave = useFieldAutoSave<UpdateSavedFilterInput, SavedFilter>({
    id: filter.id,
    update: updateFilter,
    labels: DESCRIPTION_LABELS,
    initial: {
      description: filter.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      description: filter.description ?? "",
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
          placeholder={t("Optional — what this filter is for.")}
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
 * The saved filter's read-only filter summary. A standalone placeable field; the filters themselves are
 * edited from a bookmark listing page ("Save current filters"), so this is informational in both modes.
 */
export function SavedFilterFiltersField({
  filter,
}: SavedFilterFieldProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <p className="text-sm leading-none font-medium">{t("Filters")}</p>
      <p className="text-sm text-muted-foreground">
        {summarizeBookmarkSearch(filter.filters)}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("Edit filters from a bookmark listing page and use “Save current filters”.")}
      </p>
    </div>
  );
}

/** The saved filter's sidebar-shortcut flag. A standalone placeable field; saves on change. */
export function SavedFilterViewableOnlineEditField({
  filter,
}: SavedFilterFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateFilter = useUpdateSavedFilter();
  const autoSave = useFieldAutoSave<UpdateSavedFilterInput, SavedFilter>({
    id: filter.id,
    update: updateFilter,
    labels: VIEWABLE_ONLINE_LABELS,
    initial: {
      viewableOnline: filter.viewableOnline,
    },
  });
  const checkboxId = `viewable-online-${filter.id}`;

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={checkboxId}
        checked={filter.viewableOnline}
        onCheckedChange={checked => autoSave.saveField("viewableOnline", checked === true)}
      />
      <Label
        htmlFor={checkboxId}
        className="font-normal"
      >
        {t("Show as a sidebar shortcut")}
      </Label>
    </div>
  );
}

interface Props {
  filter: SavedFilter;
}

/**
 * Edit a saved filter's name, description, and sidebar-shortcut flag. Each field auto-saves (no Save
 * button). Composed from the same placeable sub-fields the saved-filter workbench registry uses, so this
 * whole-form shell (used by `SavedFilterGeneralForm.stories.tsx`) stays in lockstep with the
 * layout-driven General tab.
 */
export function SavedFilterGeneralForm({
  filter,
}: Props) {
  return (
    <div className="space-y-4">
      <SavedFilterNameEditField filter={filter} />
      <SavedFilterDescriptionEditField filter={filter} />
      <SavedFilterFiltersField filter={filter} />
      <SavedFilterViewableOnlineEditField filter={filter} />
    </div>
  );
}
