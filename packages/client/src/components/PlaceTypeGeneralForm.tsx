import type { PlaceType, UpdatePlaceTypeInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdatePlaceType } from "../hooks/usePlaceTypes";
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

const NAME_LABELS: Partial<Record<keyof UpdatePlaceTypeInput, string>> = {
  name: "Name",
};

const SORT_ORDER_LABELS: Partial<Record<keyof UpdatePlaceTypeInput, string>> = {
  sortOrder: "Sort order",
};

const DESCRIPTION_LABELS: Partial<Record<keyof UpdatePlaceTypeInput, string>> = {
  description: "Description",
};

interface PlaceTypeFieldProps {
  placeType: PlaceType;
}

/**
 * The place type's name. A standalone placeable field (the `name` field in the registry); it mounts its
 * own `useAppForm` + `useFieldAutoSave` (no cross-field coordination — the Category #1186 precedent).
 * Auto-saves on blur and follows the new slug.
 */
export function PlaceTypeNameEditField({
  placeType,
}: PlaceTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updatePlaceType = useUpdatePlaceType();
  const autoSave = useFieldAutoSave<UpdatePlaceTypeInput, PlaceType>({
    id: placeType.id,
    update: updatePlaceType,
    labels: NAME_LABELS,
    initial: {
      name: placeType.name,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: placeType.name,
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
              // Renaming changes the slug; follow it so the edit page keeps resolving.
              onSuccess: (updated) => {
                if (updated.slug !== placeType.slug) {
                  void navigate({
                    to: "/taxonomies/place-types/$placeTypeSlug/edit",
                    params: {
                      placeTypeSlug: updated.slug,
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

/** The place type's sort order. A standalone placeable field; saves on blur. */
export function PlaceTypeSortOrderEditField({
  placeType,
}: PlaceTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const updatePlaceType = useUpdatePlaceType();
  const autoSave = useFieldAutoSave<UpdatePlaceTypeInput, PlaceType>({
    id: placeType.id,
    update: updatePlaceType,
    labels: SORT_ORDER_LABELS,
    initial: {
      sortOrder: placeType.sortOrder,
    },
  });

  const form = useAppForm({
    defaultValues: {
      sortOrder: placeType.sortOrder,
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

/** The place type's description. A standalone placeable field; saves on blur. */
export function PlaceTypeDescriptionEditField({
  placeType,
}: PlaceTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const updatePlaceType = useUpdatePlaceType();
  const autoSave = useFieldAutoSave<UpdatePlaceTypeInput, PlaceType>({
    id: placeType.id,
    update: updatePlaceType,
    labels: DESCRIPTION_LABELS,
    initial: {
      description: placeType.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      description: placeType.description ?? "",
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
