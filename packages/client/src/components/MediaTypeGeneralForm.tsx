import type { MediaType, UpdateMediaTypeInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";
import { useMediaTypes, useUpdateMediaType } from "@/hooks/useMediaTypes";
import { useAppForm } from "@/lib/form";

/** Sentinel for the "(top level)" option, since Radix Select forbids an empty-string value. */
const ROOT = "__root__";

const mediaTypeGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  romanizedName: z.string(),
  sortOrder: z.number().int(),
  icon: z.string().nullable(),
  parent: z.string(),
});

const LABELS: Record<keyof UpdateMediaTypeInput, string> = {
  name: "Name",
  romanizedName: "Romanized name",
  sortOrder: "Sort order",
  icon: "Icon",
  parentId: "Parent",
};

interface Props {
  mediaType: MediaType;
}

/**
 * Edit a media type's name, sort order, icon, and parent. Each field auto-saves (no Save button).
 * Icons/parent are editable for all types; name/sort order are locked on built-ins. Nesting is one
 * level deep, so only root types may be chosen as a parent, and a type that already has children
 * can't itself become a child.
 */
export function MediaTypeGeneralForm({
  mediaType,
}: Props) {
  const navigate = useNavigate();
  const updateMediaType = useUpdateMediaType();
  const {
    data: allMediaTypes,
  } = useMediaTypes();
  const autoSave = useFieldAutoSave<UpdateMediaTypeInput, MediaType>({
    id: mediaType.id,
    update: updateMediaType,
    labels: LABELS,
    initial: {
      name: mediaType.name,
      romanizedName: mediaType.romanizedName ?? "",
      sortOrder: mediaType.sortOrder,
      icon: mediaType.icon,
      parentId: mediaType.parentId,
    },
  });

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
        romanized: m.romanizedName,
      })),
  ];

  const form = useAppForm({
    defaultValues: {
      name: mediaType.name,
      romanizedName: mediaType.romanizedName ?? "",
      sortOrder: mediaType.sortOrder,
      icon: mediaType.icon,
      parent: mediaType.parentId ?? ROOT,
    },
    validators: {
      onChange: mediaTypeGeneralSchema,
    },
  });

  return (
    <div className="space-y-4">
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
              onBlur={() => autoSave.saveField(
                "name",
                field.state.value.trim(),
                {
                  valid: field.state.meta.errors.length === 0,
                  // Renaming changes the slug; follow it so the edit page keeps resolving.
                  onSuccess: (updated) => {
                    if (updated.slug !== mediaType.slug) {
                      void navigate({
                        to: "/taxonomies/media-types/$mediaTypeSlug/edit/general",
                        params: {
                          mediaTypeSlug: updated.slug,
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
              disabled={mediaType.builtIn}
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

      <form.AppField name="romanizedName">
        {field => (
          <field.TextField
            label="Romanized name"
            placeholder="Optional romanized form"
            onBlur={() => autoSave.saveField("romanizedName", field.state.value.trim())}
          />
        )}
      </form.AppField>

      <form.AppField name="parent">
        {field => (
          <field.SelectField
            label="Parent"
            options={parentOptions}
            placeholder="Choose a parent"
            disabled={hasChildren}
            onValueChange={value => autoSave.saveField(
              "parentId",
              value === ROOT ? null : value,
            )}
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
              onChange={(value) => {
                field.handleChange(value);
                autoSave.saveField("icon", value);
              }}
            />
          </div>
        )}
      </form.AppField>
      <GenreMoodAssignmentSection
        ownerType="mediaType"
        ownerId={mediaType.id}
      />
    </div>
  );
}
