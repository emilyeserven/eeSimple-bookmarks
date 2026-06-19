import { z } from "zod";

import { useCreatePropertyGroup } from "../hooks/usePropertyGroups";
import { useAppForm } from "../lib/form";

const addPropertyGroupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  priority: z.number().int(),
});

/** Inline "add a property group" form. */
export function AddPropertyGroupForm() {
  const createGroup = useCreatePropertyGroup();

  const form = useAppForm({
    defaultValues: {
      name: "",
      priority: 0,
    },
    validators: {
      onChange: addPropertyGroupSchema,
    },
    onSubmit: ({
      value,
    }) => {
      createGroup.mutate(
        {
          name: value.name.trim(),
          priority: value.priority,
        },
        {
          onSuccess: () => form.reset(),
        },
      );
    },
  });

  return (
    <form
      className="rounded-lg border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div
        className="
          grid gap-3
          sm:grid-cols-[1fr_8rem_auto] sm:items-end
        "
      >
        <form.AppField name="name">
          {field => (
            <field.TextField
              label="Name"
              placeholder="e.g. Ratings"
            />
          )}
        </form.AppField>
        <form.AppField name="priority">
          {field => (
            <field.NumberField
              label="Priority"
              hint="Lower sorts first."
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton
            label="Add group"
            pendingLabel="Adding…"
          />
        </form.AppForm>
      </div>
      {createGroup.isError
        ? <p className="mt-2 text-sm text-destructive">{createGroup.error.message}</p>
        : null}
    </form>
  );
}
