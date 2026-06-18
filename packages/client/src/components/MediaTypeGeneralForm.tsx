import type { MediaType } from "@eesimple/types";

import { z } from "zod";

import { useUpdateMediaType } from "@/hooks/useMediaTypes";
import { useAppForm } from "@/lib/form";

const mediaTypeGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sortOrder: z.number().int(),
});

interface Props {
  mediaType: MediaType;
}

/** Edit a media type's name and sort order. */
export function MediaTypeGeneralForm({
  mediaType,
}: Props) {
  const updateMediaType = useUpdateMediaType();

  const form = useAppForm({
    defaultValues: {
      name: mediaType.name,
      sortOrder: mediaType.sortOrder,
    },
    validators: {
      onChange: mediaTypeGeneralSchema,
    },
    onSubmit: ({
      value,
    }) => {
      if (mediaType.builtIn) return;
      updateMediaType.mutate({
        id: mediaType.id,
        input: {
          name: value.name.trim(),
          sortOrder: value.sortOrder,
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

      {!mediaType.builtIn
        ? (
          <form.AppForm>
            <form.Subscribe selector={state => state.values}>
              {(values) => {
                const dirty
                  = values.name.trim() !== mediaType.name
                    || values.sortOrder !== mediaType.sortOrder;
                return (
                  <form.SubmitButton
                    label="Save changes"
                    size="sm"
                    disabledWhen={!dirty}
                  />
                );
              }}
            </form.Subscribe>
          </form.AppForm>
        )
        : null}
    </form>
  );
}
