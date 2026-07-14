import type { Person, UpdatePersonInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../../hooks/useFieldAutoSave";
import { useUpdatePerson } from "../../hooks/usePeople";
import { usePrimaryLanguageField } from "../../hooks/usePrimaryLanguageField";
import { useAppForm } from "../../lib/form";

interface Props {
  person: Person;
}

const detailsSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
});

const DETAILS_LABELS: Partial<Record<keyof UpdatePersonInput, string>> = {
  name: "Name",
  description: "Description",
};

/**
 * Name + Description core (the `details` field). The two share one `useAppForm`, so they stay one
 * placeable unit (mirrors `CategoryDetailsFields`). Name auto-saves on blur — following the new slug —
 * and re-syncs the primary-language name value via the react-query-backed `usePrimaryLanguageField`
 * (coordinating with the standalone `PersonPrimaryLanguageEdit` field through the shared cache).
 */
export function PersonDetailsFields({
  person,
}: Props) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const update = useUpdatePerson();
  const primaryLanguage = usePrimaryLanguageField("person", person.id);
  const autoSave = useFieldAutoSave<UpdatePersonInput, Person>({
    id: person.id,
    update,
    labels: DETAILS_LABELS,
    initial: {
      name: person.name,
      description: person.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: person.name,
      description: person.description ?? "",
    },
    validators: {
      onChange: detailsSchema,
    },
  });

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label={t("Name")}
            onBlur={() => {
              const trimmed = field.state.value.trim();
              autoSave.saveField("name", trimmed, {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug !== person.slug) {
                    void navigate({
                      to: "/taxonomies/people/$personSlug/edit",
                      params: {
                        personSlug: updated.slug,
                      },
                    });
                  }
                },
              });
              primaryLanguage.syncPrimaryValue(trimmed);
            }}
          />
        )}
      </form.AppField>
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
    </div>
  );
}
