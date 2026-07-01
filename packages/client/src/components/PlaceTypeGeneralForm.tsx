import type { PlaceType, UpdatePlaceTypeInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdatePlaceType } from "../hooks/usePlaceTypes";
import { useAppForm } from "../lib/form";

const placeTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sortOrder: z.number(),
});

const LABELS: Partial<Record<keyof UpdatePlaceTypeInput, string>> = {
  name: "Name",
  sortOrder: "Sort order",
};

interface PlaceTypeGeneralFormProps {
  placeType: PlaceType;
}

/** Edit a place type's name and sort order. Each field auto-saves (no Save button). */
export function PlaceTypeGeneralForm({
  placeType,
}: PlaceTypeGeneralFormProps) {
  const navigate = useNavigate();
  const updatePlaceType = useUpdatePlaceType();
  const autoSave = useFieldAutoSave<UpdatePlaceTypeInput, PlaceType>({
    id: placeType.id,
    update: updatePlaceType,
    labels: LABELS,
    initial: {
      name: placeType.name,
      sortOrder: placeType.sortOrder,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: placeType.name,
      sortOrder: placeType.sortOrder,
    },
    validators: {
      onChange: placeTypeSchema,
    },
  });

  return (
    <div className="space-y-4">
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <form.AppField name="name">
          {field => (
            <field.TextField
              label="Name"
              onBlur={() => autoSave.saveField(
                "name",
                field.state.value.trim(),
                {
                  valid: field.state.meta.errors.length === 0,
                  // Renaming changes the slug; follow it so the edit page keeps resolving.
                  onSuccess: (updated) => {
                    if (updated.slug !== placeType.slug) {
                      void navigate({
                        to: "/taxonomies/place-types/$placeTypeSlug/edit/general",
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
        <form.AppField name="sortOrder">
          {field => (
            <field.NumberField
              label="Sort order"
              hint="Lower numbers sort first."
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
      </div>
    </div>
  );
}
