import type { LocationRelation, UpdateLocationRelationInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateLocationRelation } from "../hooks/useLocationRelations";
import { useAppForm } from "../lib/form";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const sortOrderSchema = z.object({
  sortOrder: z.number(),
});

const descriptionSchema = z.object({
  description: z.string(),
});

const NAME_LABELS: Partial<Record<keyof UpdateLocationRelationInput, string>> = {
  name: "Name",
};

const SORT_ORDER_LABELS: Partial<Record<keyof UpdateLocationRelationInput, string>> = {
  sortOrder: "Sort order",
};

const DESCRIPTION_LABELS: Partial<Record<keyof UpdateLocationRelationInput, string>> = {
  description: "Description",
};

interface LocationRelationFieldProps {
  locationRelation: LocationRelation;
}

/**
 * The location relation's name. A standalone placeable field (the `name` field in the registry); it
 * mounts its own `useAppForm` + `useFieldAutoSave` (no cross-field coordination — the Category #1186
 * precedent). Auto-saves on blur and follows the new slug. A built-in relation can't be renamed, so the
 * field is disabled and shows the built-in notice.
 */
export function LocationRelationNameEditField({
  locationRelation,
}: LocationRelationFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateLocationRelation = useUpdateLocationRelation();
  const autoSave = useFieldAutoSave<UpdateLocationRelationInput, LocationRelation>({
    id: locationRelation.id,
    update: updateLocationRelation,
    labels: NAME_LABELS,
    initial: {
      name: locationRelation.name,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: locationRelation.name,
    },
    validators: {
      onChange: nameSchema,
    },
  });

  return (
    <div className="space-y-2">
      {locationRelation.builtIn
        ? (
          <p className="text-sm text-muted-foreground">
            {t("This is a built-in relation. It can’t be renamed or deleted, but you can adjust its sort order and description.")}
          </p>
        )
        : null}
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
    </div>
  );
}

/** The location relation's sort order. A standalone placeable field; saves on blur. */
export function LocationRelationSortOrderEditField({
  locationRelation,
}: LocationRelationFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateLocationRelation = useUpdateLocationRelation();
  const autoSave = useFieldAutoSave<UpdateLocationRelationInput, LocationRelation>({
    id: locationRelation.id,
    update: updateLocationRelation,
    labels: SORT_ORDER_LABELS,
    initial: {
      sortOrder: locationRelation.sortOrder,
    },
  });

  const form = useAppForm({
    defaultValues: {
      sortOrder: locationRelation.sortOrder,
    },
    validators: {
      onChange: sortOrderSchema,
    },
  });

  return (
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
  );
}

/** The location relation's description. A standalone placeable field; saves on blur. */
export function LocationRelationDescriptionEditField({
  locationRelation,
}: LocationRelationFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateLocationRelation = useUpdateLocationRelation();
  const autoSave = useFieldAutoSave<UpdateLocationRelationInput, LocationRelation>({
    id: locationRelation.id,
    update: updateLocationRelation,
    labels: DESCRIPTION_LABELS,
    initial: {
      description: locationRelation.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      description: locationRelation.description ?? "",
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
