import type { MediaType } from "@eesimple/types";

import { z } from "zod";

import { useUpdateMediaType } from "@/hooks/useMediaTypes";
import { useAppForm } from "@/lib/form";
import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";

const mediaTypeGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sortOrder: z.number().int(),
  icon: z.string().nullable(),
});

interface Props {
  mediaType: MediaType;
}

/** Edit a media type's name, sort order, and icon. Icons are editable for all types; name/sort order are locked on built-ins. */
export function MediaTypeGeneralForm({
  mediaType,
}: Props) {
  const updateMediaType = useUpdateMediaType();

  const form = useAppForm({
    defaultValues: {
      name: mediaType.name,
      sortOrder: mediaType.sortOrder,
      icon: mediaType.icon,
    },
    validators: {
      onChange: mediaTypeGeneralSchema,
    },
    onSubmit: ({
      value,
    }) => {
      updateMediaType.mutate({
        id: mediaType.id,
        input: {
          name: value.name.trim(),
          sortOrder: value.sortOrder,
          icon: value.icon,
        },
      });
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {mediaType.builtIn
        ? (
          <p className="text-sm text-muted-foreground">
            Built-in media type — it can&apos;t be renamed or reordered.
          </p>
        )
        : null}

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
              disabled={mediaType.builtIn}
            />
          )}
        </form.AppField>
        <form.AppField name="sortOrder">
          {field => (
            <field.NumberField
              label="Sort order"
              disabled={mediaType.builtIn}
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name="icon">
        {field => (
          <div className="space-y-1">
            <Label>Icon</Label>
            <IconPicker
              aria-label={`Icon for ${mediaType.name}`}
              value={field.state.value}
              onChange={field.handleChange}
            />
          </div>
        )}
      </form.AppField>

      <form.AppForm>
        <form.SubmitButton
          label="Save changes"
          size="sm"
          requireDirty
        />
      </form.AppForm>
    </form>
  );
}
