import type { PropertyGroup } from "@eesimple/types";

import { z } from "zod";

import { useUpdatePropertyGroup } from "@/hooks/usePropertyGroups";
import { useAppForm } from "@/lib/form";

const propertyGroupGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  priority: z.number().int(),
  description: z.string(),
});

interface Props {
  group: PropertyGroup;
}

/** Edit a property group's name, priority, and description. */
export function PropertyGroupGeneralForm({
  group,
}: Props) {
  const updateGroup = useUpdatePropertyGroup();

  const form = useAppForm({
    defaultValues: {
      name: group.name,
      priority: group.priority,
      description: group.description ?? "",
    },
    validators: {
      onChange: propertyGroupGeneralSchema,
    },
    onSubmit: ({
      value,
    }) => {
      updateGroup.mutate({
        id: group.id,
        input: {
          name: value.name.trim(),
          priority: value.priority,
          description: value.description.trim() || null,
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
      <div
        className="
          grid gap-3
          sm:grid-cols-[1fr_8rem]
        "
      >
        <form.AppField name="name">
          {field => <field.TextField label="Name" />}
        </form.AppField>
        <form.AppField name="priority">
          {field => (
            <field.NumberField
              label="Priority"
              hint="Lower sorts first."
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label="Description"
            placeholder="Optional — what this group is for."
          />
        )}
      </form.AppField>

      <form.AppForm>
        <form.SubmitButton
          label="Save changes"
          size="sm"
          requireDirty
        />
      </form.AppForm>

      {updateGroup.isError
        ? <p className="text-sm text-destructive">{updateGroup.error.message}</p>
        : null}
    </form>
  );
}
