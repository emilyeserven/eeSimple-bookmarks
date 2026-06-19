import type { MediaType } from "@eesimple/types";

import { z } from "zod";

import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";
import { useMediaTypes, useUpdateMediaType } from "@/hooks/useMediaTypes";
import { useAppForm } from "@/lib/form";

/** Sentinel for the "(top level)" option, since Radix Select forbids an empty-string value. */
const ROOT = "__root__";

const mediaTypeGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sortOrder: z.number().int(),
  icon: z.string().nullable(),
  parent: z.string(),
});

interface Props {
  mediaType: MediaType;
}

/**
 * Edit a media type's name, sort order, icon, and parent. Icons/parent are editable for all types;
 * name/sort order are locked on built-ins. Nesting is one level deep, so only root types may be
 * chosen as a parent, and a type that already has children can't itself become a child.
 */
export function MediaTypeGeneralForm({
  mediaType,
}: Props) {
  const updateMediaType = useUpdateMediaType();
  const {
    data: allMediaTypes,
  } = useMediaTypes();

  const all = allMediaTypes ?? [];
  const hasChildren = all.some(m => m.parentId === mediaType.id);
  const parentOptions = [
    {
      value: ROOT,
      label: "(top level)",
    },
    ...all
      // One level only: a parent must be a root, and a type can't parent itself.
      .filter(m => m.parentId === null && m.id !== mediaType.id)
      .map(m => ({
        value: m.id,
        label: m.name,
      })),
  ];

  const form = useAppForm({
    defaultValues: {
      name: mediaType.name,
      sortOrder: mediaType.sortOrder,
      icon: mediaType.icon,
      parent: mediaType.parentId ?? ROOT,
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
          parentId: value.parent === ROOT ? null : value.parent,
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

      <form.AppField name="parent">
        {field => (
          <field.SelectField
            label="Parent"
            options={parentOptions}
            placeholder="Choose a parent"
            disabled={hasChildren}
          />
        )}
      </form.AppField>
      {hasChildren
        ? (
          <p className="text-xs text-muted-foreground">
            This type has nested types, so it stays at the top level. Media types nest one level deep.
          </p>
        )
        : null}

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
