import type { PropertyGroup, UpdatePropertyGroupInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { useUpdatePropertyGroup } from "@/hooks/usePropertyGroups";
import { useAppForm } from "@/lib/form";

const propertyGroupGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  priority: z.number().int(),
  description: z.string(),
});

const LABELS: Partial<Record<keyof UpdatePropertyGroupInput, string>> = {
  name: "Name",
  priority: "Priority",
  description: "Description",
};

interface Props {
  group: PropertyGroup;
}

/** Edit a property group's name, priority, and description. Each field auto-saves (no Save button). */
export function PropertyGroupGeneralForm({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateGroup = useUpdatePropertyGroup();
  const autoSave = useFieldAutoSave<UpdatePropertyGroupInput, PropertyGroup>({
    id: group.id,
    update: updateGroup,
    labels: LABELS,
    initial: {
      name: group.name,
      priority: group.priority,
      description: group.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: group.name,
      priority: group.priority,
      description: group.description ?? "",
    },
    validators: {
      onChange: propertyGroupGeneralSchema,
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
                    if (updated.slug !== group.slug) {
                      void navigate({
                        to: "/taxonomies/property-groups/$propertyGroupSlug/edit",
                        params: {
                          propertyGroupSlug: updated.slug,
                        },
                      });
                    }
                  },
                },
              )}
            />
          )}
        </form.AppField>
        <form.AppField name="priority">
          {field => (
            <field.NumberField
              label={t("Priority")}
              hint={t("Lower sorts first.")}
              onBlur={() => autoSave.saveField(
                "priority",
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
            placeholder={t("Optional — what this group is for.")}
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
