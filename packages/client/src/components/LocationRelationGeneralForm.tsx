import type { LocationRelation, UpdateLocationRelationInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateLocationRelation } from "../hooks/useLocationRelations";
import { useAppForm } from "../lib/form";

const locationRelationSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sortOrder: z.number(),
  description: z.string(),
});

const LABELS: Partial<Record<keyof UpdateLocationRelationInput, string>> = {
  name: "Name",
  sortOrder: "Sort order",
  description: "Description",
};

interface LocationRelationGeneralFormProps {
  locationRelation: LocationRelation;
}

/** Edit a location relation's name and sort order. Each field auto-saves (no Save button). */
export function LocationRelationGeneralForm({
  locationRelation,
}: LocationRelationGeneralFormProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateLocationRelation = useUpdateLocationRelation();
  const autoSave = useFieldAutoSave<UpdateLocationRelationInput, LocationRelation>({
    id: locationRelation.id,
    update: updateLocationRelation,
    labels: LABELS,
    initial: {
      name: locationRelation.name,
      sortOrder: locationRelation.sortOrder,
      description: locationRelation.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: locationRelation.name,
      sortOrder: locationRelation.sortOrder,
      description: locationRelation.description ?? "",
    },
    validators: {
      onChange: locationRelationSchema,
    },
  });

  return (
    <div className="space-y-4">
      {locationRelation.builtIn
        ? (
          <p className="text-sm text-muted-foreground">
            {t("This is a built-in relation. It can’t be renamed or deleted, but you can adjust its sort order and description.")}
          </p>
        )
        : null}
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <form.AppField name="name">
          {field => (
            <field.TextField
              label={t("Name")}
              disabled={locationRelation.builtIn}
              onBlur={() => autoSave.saveField(
                "name",
                field.state.value.trim(),
                {
                  valid: field.state.meta.errors.length === 0,
                  // Renaming changes the slug; follow it so the edit page keeps resolving.
                  onSuccess: (updated) => {
                    if (updated.slug !== locationRelation.slug) {
                      void navigate({
                        to: "/taxonomies/location-relations/$locationRelationSlug/edit",
                        params: {
                          locationRelationSlug: updated.slug,
                        },
                      });
                    }
                  },
                },
              )}
            />
          )}
        </form.AppField>
        <form.AppField name="sortOrder">
          {field => (
            <field.NumberField
              label={t("Sort order")}
              hint={t("Lower numbers sort first.")}
              onBlur={() => autoSave.saveField(
                "sortOrder",
                field.state.value,
                {
                  valid: field.state.meta.errors.length === 0,
                },
              )}
            />
          )}
        </form.AppField>
        <form.AppField name="description">
          {field => (
            <field.TextareaField
              label={t("Description")}
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
      </div>
    </div>
  );
}
