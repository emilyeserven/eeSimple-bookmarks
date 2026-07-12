import type { MediaType, UpdateMediaTypeInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { usePrimaryLanguageField } from "../hooks/usePrimaryLanguageField";

import { Checkbox } from "@/components/ui/checkbox";
import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";
import { useMediaTypes, useUpdateMediaType } from "@/hooks/useMediaTypes";
import { useAppForm } from "@/lib/form";

/** Sentinel for the "(top level)" option, since Radix Select forbids an empty-string value. */
const ROOT = "__root__";

/** Toast wording per field. Raw strings (mirrors {@link ../CategoryGeneralForm}'s `LABELS`). */
const LABELS: Partial<Record<keyof UpdateMediaTypeInput, string>> = {
  name: "Name",
  description: "Description",
  sortOrder: "Sort order",
  icon: "Icon",
  parentId: "Parent",
  hidden: "Hidden",
};

interface MediaTypeFieldProps {
  mediaType: MediaType;
}

/**
 * The Hidden toggle (plus the built-in notice). A placeable, self-saving field (`hidden` in the media
 * type workbench registry). Built-ins can't be renamed/reordered but can be hidden, so the notice and
 * checkbox live together, outside the name/sort-order rename guards.
 */
export function MediaTypeHiddenEdit({
  mediaType,
}: MediaTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateMediaType = useUpdateMediaType();
  const autoSave = useFieldAutoSave<UpdateMediaTypeInput, MediaType>({
    id: mediaType.id,
    update: updateMediaType,
    labels: LABELS,
    initial: {
      hidden: mediaType.hidden,
    },
  });
  return (
    <div className="space-y-4">
      {mediaType.builtIn
        ? (
          <p className="text-sm text-muted-foreground">
            {t("Built-in media type — it can't be renamed or reordered, but it can be hidden.")}
          </p>
        )
        : null}
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={mediaType.hidden}
          onCheckedChange={checked => autoSave.saveField("hidden", checked === true)}
          aria-label={t("Hidden")}
        />
        {t("Hide from media-type pickers and filters (existing bookmarks keep it)")}
      </label>
    </div>
  );
}

/**
 * The name field (the `name` field in the registry). Auto-saves on blur (following the new slug so the
 * edit page keeps resolving) and re-syncs the primary-language name value via `usePrimaryLanguageField`
 * — which is react-query-backed, so it coordinates with the standalone `MediaTypePrimaryLanguageEdit`
 * field through the shared cache (the Category pattern, so no shared form controller is needed). Locked
 * on built-ins.
 */
export function MediaTypeNameEdit({
  mediaType,
}: MediaTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateMediaType = useUpdateMediaType();
  const primaryLanguage = usePrimaryLanguageField("mediaType", mediaType.id);
  const autoSave = useFieldAutoSave<UpdateMediaTypeInput, MediaType>({
    id: mediaType.id,
    update: updateMediaType,
    labels: LABELS,
    initial: {
      name: mediaType.name,
    },
  });
  const form = useAppForm({
    defaultValues: {
      name: mediaType.name,
    },
    validators: {
      onChange: z.object({
        name: z.string().trim().min(1, "Name is required"),
      }),
    },
  });
  return (
    <form.AppField name="name">
      {field => (
        <field.TextField
          label={t("Name")}
          disabled={mediaType.builtIn}
          onBlur={() => {
            const trimmed = field.state.value.trim();
            autoSave.saveField(
              "name",
              trimmed,
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug !== mediaType.slug) {
                    void navigate({
                      to: "/taxonomies/media-types/$mediaTypeSlug/edit",
                      params: {
                        mediaTypeSlug: updated.slug,
                      },
                    });
                  }
                },
              },
            );
            primaryLanguage.syncPrimaryValue(trimmed);
          }}
        />
      )}
    </form.AppField>
  );
}

/** The sort-order field (`sortOrder`). Auto-saves on blur; locked on built-ins. */
export function MediaTypeSortOrderEdit({
  mediaType,
}: MediaTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateMediaType = useUpdateMediaType();
  const autoSave = useFieldAutoSave<UpdateMediaTypeInput, MediaType>({
    id: mediaType.id,
    update: updateMediaType,
    labels: LABELS,
    initial: {
      sortOrder: mediaType.sortOrder,
    },
  });
  const form = useAppForm({
    defaultValues: {
      sortOrder: mediaType.sortOrder,
    },
    validators: {
      onChange: z.object({
        sortOrder: z.number().int(),
      }),
    },
  });
  return (
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
  );
}

/** The description field (`description`). Auto-saves on blur (empty → `null`). */
export function MediaTypeDescriptionEdit({
  mediaType,
}: MediaTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateMediaType = useUpdateMediaType();
  const autoSave = useFieldAutoSave<UpdateMediaTypeInput, MediaType>({
    id: mediaType.id,
    update: updateMediaType,
    labels: LABELS,
    initial: {
      description: mediaType.description ?? null,
    },
  });
  const form = useAppForm({
    defaultValues: {
      description: mediaType.description ?? "",
    },
    validators: {
      onChange: z.object({
        description: z.string(),
      }),
    },
  });
  return (
    <form.AppField name="description">
      {field => (
        <field.TextareaField
          label={t("Description")}
          debounceSave
          onBlur={() => autoSave.saveField(
            "description",
            field.state.value.trim() || null,
            {
              valid: field.state.meta.errors.length === 0,
            },
          )}
        />
      )}
    </form.AppField>
  );
}

/**
 * The parent picker (`parent`). One level of nesting only: a parent must be a root, and a type that
 * already has children can't itself become a child. Auto-saves on change.
 */
export function MediaTypeParentEdit({
  mediaType,
}: MediaTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateMediaType = useUpdateMediaType();
  const {
    data: allMediaTypes,
  } = useMediaTypes();
  const autoSave = useFieldAutoSave<UpdateMediaTypeInput, MediaType>({
    id: mediaType.id,
    update: updateMediaType,
    labels: LABELS,
    initial: {
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
      parent: mediaType.parentId ?? ROOT,
    },
    validators: {
      onChange: z.object({
        parent: z.string(),
      }),
    },
  });

  return (
    <div className="space-y-1">
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
    </div>
  );
}

/** The icon picker (`icon`). Auto-saves on change. */
export function MediaTypeIconEdit({
  mediaType,
}: MediaTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateMediaType = useUpdateMediaType();
  const autoSave = useFieldAutoSave<UpdateMediaTypeInput, MediaType>({
    id: mediaType.id,
    update: updateMediaType,
    labels: LABELS,
    initial: {
      icon: mediaType.icon,
    },
  });
  const form = useAppForm({
    defaultValues: {
      icon: mediaType.icon,
    },
    validators: {
      onChange: z.object({
        icon: z.string().nullable(),
      }),
    },
  });
  return (
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
  );
}

/**
 * The primary-language picker (`primaryLanguage`). A standalone placeable field; it mounts its own
 * `usePrimaryLanguageField` (react-query-backed, so it coordinates with the name field's sync via the
 * shared cache) and seeds a newly-set primary row with the media type's saved name.
 */
export function MediaTypePrimaryLanguageEdit({
  mediaType,
}: MediaTypeFieldProps) {
  const primaryLanguage = usePrimaryLanguageField("mediaType", mediaType.id);
  return (
    <PrimaryLanguageField
      value={primaryLanguage.primaryLanguageId}
      onValueChange={v => primaryLanguage.setPrimaryLanguage(v, mediaType.name)}
    />
  );
}

/** The additional-names editor (`names`). Self-saving via `EntityNamesTabEditor`. */
export function MediaTypeNamesEdit({
  mediaType,
}: MediaTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{t("Names")}</Label>
      <EntityNamesTabEditor
        ownerType="mediaType"
        ownerId={mediaType.id}
      />
    </div>
  );
}

/**
 * Edit a media type's fields. Each field auto-saves (no Save button). Composed from the same placeable
 * sub-fields the media type workbench registry uses, so this whole-form shell (used by the form's story
 * and test) stays in lockstep with the layout-driven General tab. Icons/parent are editable for all
 * types; name/sort order are locked on built-ins.
 */
export function MediaTypeGeneralForm({
  mediaType,
}: MediaTypeFieldProps) {
  return (
    <div className="space-y-4">
      <MediaTypeHiddenEdit mediaType={mediaType} />
      <MediaTypeNameEdit mediaType={mediaType} />
      <MediaTypeSortOrderEdit mediaType={mediaType} />
      <MediaTypeDescriptionEdit mediaType={mediaType} />
      <MediaTypePrimaryLanguageEdit mediaType={mediaType} />
      <MediaTypeNamesEdit mediaType={mediaType} />
      <MediaTypeParentEdit mediaType={mediaType} />
      <MediaTypeIconEdit mediaType={mediaType} />
      <GenreMoodAssignmentSection
        ownerType="mediaType"
        ownerId={mediaType.id}
      />
    </div>
  );
}
