import type { MediaType, UpdateMediaTypeInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
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
  sortOrder: z.number().int(),
  icon: z.string().nullable(),
  parent: z.string(),
});

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
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateMediaType = useUpdateMediaType();
  const {
    data: allMediaTypes,
  } = useMediaTypes();
  const labels: Record<keyof UpdateMediaTypeInput, string> = {
    name: t("Name"),
    sortOrder: t("Sort order"),
    icon: t("Icon"),
    parentId: t("Parent"),
  };
  const autoSave = useFieldAutoSave<UpdateMediaTypeInput, MediaType>({
    id: mediaType.id,
    update: updateMediaType,
    labels,
    initial: {
      name: mediaType.name,
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
      label: t("(top level)"),
    },
    ...all
      // One level only: a parent must be a root, and a type can't parent itself.
      .filter(m => m.parentId === null && m.id !== mediaType.id)
      .map(m => ({
        value: m.id,
        label: m.name,
        names: m.names,
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
  });

  return (
    <div className="space-y-4">
      {mediaType.builtIn
        ? (
          <p className="text-sm text-muted-foreground">
            {t("Built-in media type — it can't be renamed or reordered.")}
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
              label={t("Name")}
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
              label={t("Sort order")}
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

      <div className="space-y-1">
        <Label>{t("Names")}</Label>
        <EntityNamesTabEditor
          ownerType="mediaType"
          ownerId={mediaType.id}
        />
      </div>

      <form.AppField name="parent">
        {field => (
          <field.SelectField
            label={t("Parent")}
            options={parentOptions}
            placeholder={t("Choose a parent")}
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
            {t("This type has nested types, so it stays at the top level. Media types nest one level deep.")}
          </p>
        )
        : null}

      <form.AppField name="icon">
        {field => (
          <div className="space-y-1">
            <Label>{t("Icon")}</Label>
            <IconPicker
              aria-label={t("Icon for {{name}}", {
                name: mediaType.name,
              })}
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
