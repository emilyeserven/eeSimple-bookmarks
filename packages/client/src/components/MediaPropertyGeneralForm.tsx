import type { MediaProperty, UpdateMediaPropertyInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { useUpdateMediaProperty } from "@/hooks/useMediaProperties";
import { useAppForm } from "@/lib/form";

const mediaPropertyGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sortOrder: z.number().int(),
});

const LABELS: Record<keyof UpdateMediaPropertyInput, string> = {
  name: "Name",
  sortOrder: "Sort order",
};

interface Props {
  mediaProperty: MediaProperty;
}

/** Edit a media property's name and sort order. Each field auto-saves (no Save button). */
export function MediaPropertyGeneralForm({
  mediaProperty,
}: Props) {
  const navigate = useNavigate();
  const updateMediaProperty = useUpdateMediaProperty();
  const autoSave = useFieldAutoSave<UpdateMediaPropertyInput, MediaProperty>({
    id: mediaProperty.id,
    update: updateMediaProperty,
    labels: LABELS,
    initial: {
      name: mediaProperty.name,
      sortOrder: mediaProperty.sortOrder,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: mediaProperty.name,
      sortOrder: mediaProperty.sortOrder,
    },
    validators: {
      onChange: mediaPropertyGeneralSchema,
    },
  });

  return (
    <div className="space-y-4">
      <div
        className="
          grid gap-3
          sm:grid-cols-[1fr_8rem]
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
                    if (updated.slug !== mediaProperty.slug) {
                      void navigate({
                        to: "/taxonomies/media-properties/$mediaPropertySlug/edit/general",
                        params: {
                          mediaPropertySlug: updated.slug,
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
              hint="Lower sorts first."
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
