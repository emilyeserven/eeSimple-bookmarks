import type { GroupType, UpdateGroupTypeInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { useUpdateGroupType } from "@/hooks/useGroupTypes";
import { useAppForm } from "@/lib/form";

const groupTypeGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  sortOrder: z.number().int(),
});

const LABELS: Record<keyof UpdateGroupTypeInput, string> = {
  name: "Name",
  description: "Description",
  sortOrder: "Sort order",
  hidden: "Hidden",
};

interface Props {
  groupType: GroupType;
}

/** Edit a group type's name and sort order. Each field auto-saves (no Save button). */
export function GroupTypeGeneralForm({
  groupType,
}: Props) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateGroupType = useUpdateGroupType();
  const autoSave = useFieldAutoSave<UpdateGroupTypeInput, GroupType>({
    id: groupType.id,
    update: updateGroupType,
    labels: LABELS,
    initial: {
      name: groupType.name,
      description: groupType.description ?? null,
      sortOrder: groupType.sortOrder,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: groupType.name,
      description: groupType.description ?? "",
      sortOrder: groupType.sortOrder,
    },
    validators: {
      onChange: groupTypeGeneralSchema,
    },
  });

  return (
    <div className="space-y-4">
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
              onBlur={() => autoSave.saveField(
                "name",
                field.state.value.trim(),
                {
                  valid: field.state.meta.errors.length === 0,
                  // Renaming changes the slug; follow it so the edit page keeps resolving.
                  onSuccess: (updated) => {
                    if (updated.slug !== groupType.slug) {
                      void navigate({
                        to: "/taxonomies/group-types/$groupTypeSlug/edit/general",
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
      </div>
      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label={t("Description")}
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
    </div>
  );
}
