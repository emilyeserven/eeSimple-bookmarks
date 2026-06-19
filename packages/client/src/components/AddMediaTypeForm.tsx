import { z } from "zod";

import { useCreateMediaType } from "../hooks/useMediaTypes";
import { useAppForm } from "../lib/form";

import { RowCard } from "@/components/ui/card";

const addMediaTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

/** Inline "add a media type" form — adds a custom media type alongside the built-ins. */
export function AddMediaTypeForm() {
  const createMediaType = useCreateMediaType();

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: addMediaTypeSchema,
    },
    onSubmit: ({
      value,
    }) => {
      createMediaType.mutate(
        {
          name: value.name.trim(),
        },
        {
          onSuccess: () => form.reset(),
        },
      );
    },
  });

  return (
    <RowCard className="p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <div
          className="
            grid gap-3
            sm:grid-cols-[1fr_auto] sm:items-end
          "
        >
          <form.AppField name="name">
            {field => (
              <field.TextField
                label="Name"
                placeholder="e.g. Newsletter"
              />
            )}
          </form.AppField>
          <form.AppForm>
            <form.SubmitButton
              label="Add media type"
              pendingLabel="Adding…"
            />
          </form.AppForm>
        </div>
        {createMediaType.isError
          ? <p className="mt-2 text-sm text-destructive">{createMediaType.error.message}</p>
          : null}
      </form>
    </RowCard>
  );
}
