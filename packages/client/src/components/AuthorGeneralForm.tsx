import type { Author, UpdateAuthorInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useUpdateAuthor } from "../hooks/useAuthors";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useAppForm } from "../lib/form";

const authorGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const LABELS: Partial<Record<keyof UpdateAuthorInput, string>> = {
  name: "Name",
};

interface Props {
  author: Author;
}

/** Edit an author's name. Field auto-saves on blur (no Save button). */
export function AuthorGeneralForm({
  author,
}: Props) {
  const navigate = useNavigate();
  const update = useUpdateAuthor();
  const autoSave = useFieldAutoSave<UpdateAuthorInput, Author>({
    id: author.id,
    update,
    labels: LABELS,
    initial: {
      name: author.name,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: author.name,
    },
    validators: {
      onChange: authorGeneralSchema,
    },
  });

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label="Name"
            onBlur={() => autoSave.saveField(
              "name",
              field.state.value.trim(),
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug !== author.slug) {
                    void navigate({
                      to: "/taxonomies/authors/$authorSlug/edit/general",
                      params: {
                        authorSlug: updated.slug,
                      },
                    });
                  }
                },
              },
            )}
          />
        )}
      </form.AppField>
    </div>
  );
}
