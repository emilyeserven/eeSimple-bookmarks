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

const savedFilterGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
});

const LABELS: Partial<Record<keyof UpdateSavedFilterInput, string>> = {
  name: "Name",
  description: "Description",
  viewableOnline: "Viewable online",
};

interface Props {
  filter: SavedFilter;
}

/** Edit a saved filter's name, description, and sidebar-shortcut flag. Each field auto-saves. */
export function SavedFilterGeneralForm({
  filter,
}: Props) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateFilter = useUpdateSavedFilter();
  const autoSave = useFieldAutoSave<UpdateSavedFilterInput, SavedFilter>({
    id: filter.id,
    update: updateFilter,
    labels: LABELS,
    initial: {
      name: filter.name,
      description: filter.description ?? null,
      viewableOnline: filter.viewableOnline,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: filter.name,
      description: filter.description ?? "",
    },
    validators: {
      onChange: savedFilterGeneralSchema,
    },
  });

  const checkboxId = `viewable-online-${filter.id}`;

  return (
    <div className="space-y-4">
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

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label={t("Description")}
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

      <div className="space-y-1">
        <p className="text-sm leading-none font-medium">{t("Filters")}</p>
        <p className="text-sm text-muted-foreground">
          {summarizeBookmarkSearch(filter.filters)}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("Edit filters from a bookmark listing page and use “Save current filters”.")}
        </p>
      </div>

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
    </div>
  );
}
