import type { CardDisplayRule, UpdateCardDisplayRuleInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useUpdateCardDisplayRule } from "../hooks/useCardDisplayRules";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useAppForm } from "../lib/form";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
});

const LABELS: Partial<Record<keyof UpdateCardDisplayRuleInput, string>> = {
  name: "Name",
  description: "Description",
};

interface Props {
  entity: CardDisplayRule;
}

/**
 * Edit a card display rule's name + description. Each field auto-saves on blur (no Save button);
 * renaming follows the new slug so the edit page keeps resolving. The Default rule's name is fixed
 * (it is the baseline every card falls back to), so only its description is editable.
 */
export function CardDisplayRuleGeneralForm({
  entity: rule,
}: Props) {
  const navigate = useNavigate();
  const update = useUpdateCardDisplayRule();
  const autoSave = useFieldAutoSave<UpdateCardDisplayRuleInput, CardDisplayRule>({
    id: rule.id,
    update,
    labels: LABELS,
    initial: {
      name: rule.name,
      description: rule.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: rule.name,
      description: rule.description ?? "",
    },
    validators: {
      onChange: schema,
    },
  });

  return (
    <div className="space-y-4">
      {rule.isDefault
        ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">Name</p>
            <p className="text-sm text-muted-foreground">
              {rule.name}
              {" "}
              — the baseline rule&rsquo;s name can&rsquo;t be changed.
            </p>
          </div>
        )
        : (
          <form.AppField name="name">
            {field => (
              <field.TextField
                label="Name"
                placeholder="Rule name"
                onBlur={() => autoSave.saveField(
                  "name",
                  field.state.value.trim(),
                  {
                    valid: field.state.meta.errors.length === 0,
                    // Renaming changes the slug; follow it so the edit page keeps resolving.
                    onSuccess: (updated) => {
                      if (updated.slug && updated.slug !== rule.slug) {
                        void navigate({
                          to: "/card-display-rules/$ruleSlug/edit/general",
                          params: {
                            ruleSlug: updated.slug,
                          },
                        });
                      }
                    },
                  },
                )}
              />
            )}
          </form.AppField>
        )}

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label="Description"
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
