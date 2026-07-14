import type { GroupType, UpdateGroupTypeInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { useUpdateGroupType } from "@/hooks/useGroupTypes";
import { useAppForm } from "@/lib/form";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const sortOrderSchema = z.object({
  sortOrder: z.number().int(),
});

const descriptionSchema = z.object({
  description: z.string(),
});

const NAME_LABELS: Partial<Record<keyof UpdateGroupTypeInput, string>> = {
  name: "Name",
};

const SORT_ORDER_LABELS: Partial<Record<keyof UpdateGroupTypeInput, string>> = {
  sortOrder: "Sort order",
};

const DESCRIPTION_LABELS: Partial<Record<keyof UpdateGroupTypeInput, string>> = {
  description: "Description",
};

interface GroupTypeFieldProps {
  groupType: GroupType;
}

/**
 * The group type's name. A standalone placeable field (the `name` field in the registry); it mounts its
 * own `useAppForm` + `useFieldAutoSave` (no cross-field coordination — each field saves independently,
 * the Category #1186 precedent). Auto-saves on blur and follows the new slug.
 */
export function GroupTypeNameEditField({
  groupType,
}: GroupTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateGroupType = useUpdateGroupType();
  const autoSave = useFieldAutoSave<UpdateGroupTypeInput, GroupType>({
    id: groupType.id,
    update: updateGroupType,
    labels: NAME_LABELS,
    initial: {
      name: groupType.name,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: groupType.name,
    },
    validators: {
      onChange: nameSchema,
    },
  });

  return (
    <form.AppField name="name">
      {field => (
        <field.TextField
          label={t("Name")}
          onBlur={() => autoSave.saveField(
            "name",
            field.state.value.trim(),
            {
              valid: field.state.meta.errors.length === 0,
              // Renaming changes the slug; follow it so the edit page keeps resolving.
              onSuccess: (updated) => {
                if (updated.slug !== groupType.slug) {
                  void navigate({
                    to: "/taxonomies/group-types/$groupTypeSlug/edit",
                    params: {
                      groupTypeSlug: updated.slug,
                    },
                  });
                }
              },
            },
          )}
        />
      )}
    </form.AppField>
  );
}

/** The group type's sort order. A standalone placeable field; saves on blur. */
export function GroupTypeSortOrderEditField({
  groupType,
}: GroupTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateGroupType = useUpdateGroupType();
  const autoSave = useFieldAutoSave<UpdateGroupTypeInput, GroupType>({
    id: groupType.id,
    update: updateGroupType,
    labels: SORT_ORDER_LABELS,
    initial: {
      sortOrder: groupType.sortOrder,
    },
  });

  const form = useAppForm({
    defaultValues: {
      sortOrder: groupType.sortOrder,
    },
    validators: {
      onChange: sortOrderSchema,
    },
  });

  return (
    <form.AppField name="sortOrder">
      {field => (
        <field.NumberField
          label={t("Sort order")}
          hint={t("Lower sorts first.")}
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

/** The group type's description. A standalone placeable field; saves on blur. */
export function GroupTypeDescriptionEditField({
  groupType,
}: GroupTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateGroupType = useUpdateGroupType();
  const autoSave = useFieldAutoSave<UpdateGroupTypeInput, GroupType>({
    id: groupType.id,
    update: updateGroupType,
    labels: DESCRIPTION_LABELS,
    initial: {
      description: groupType.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      description: groupType.description ?? "",
    },
    validators: {
      onChange: descriptionSchema,
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

interface Props {
  groupType: GroupType;
}

/**
 * Edit a group type's name, sort order, and description. Each field auto-saves (no Save button).
 * Composed from the same placeable sub-fields the group type workbench registry uses, so this
 * whole-form shell stays in lockstep with the layout-driven General tab.
 */
export function GroupTypeGeneralForm({
  groupType,
}: Props) {
  return (
    <div className="space-y-4">
      <div
        className="
          grid gap-3
          sm:grid-cols-[1fr_8rem]
        "
      >
        <GroupTypeNameEditField groupType={groupType} />
        <GroupTypeSortOrderEditField groupType={groupType} />
      </div>
      <GroupTypeDescriptionEditField groupType={groupType} />
    </div>
  );
}
