import type { Newsletter, UpdateNewsletterInput } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { DefaultTagsField } from "./DefaultTagsField";
import { SourceDefaultFields } from "./SourceDefaultFields";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateNewsletter } from "../hooks/useNewsletters";

import { Separator } from "@/components/ui/separator";
import { useCategories } from "@/hooks/useCategories";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import { iconComboboxOptions, mediaTypeTreeComboboxOptions } from "@/lib/comboboxOptions";
import { useAppForm } from "@/lib/form";

const newsletterGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const LABELS: Partial<Record<keyof UpdateNewsletterInput, string>> = {
  name: "Name",
  categoryId: "Category",
  mediaTypeId: "Media type",
  tagIds: "Default tags",
};

interface Props {
  newsletter: Newsletter;
}

/** Edit a newsletter's name + default category / media type / tags. Each field auto-saves (no Save button). */
export function NewsletterGeneralForm({
  newsletter,
}: Props) {
  const navigate = useNavigate();
  const updateNewsletter = useUpdateNewsletter();
  const [tagIds, setTagIds] = useState<string[]>(newsletter.tagIds ?? []);
  const {
    data: categories,
  } = useCategories();
  const {
    data: mediaTypeTree,
  } = useMediaTypeTree();
  const {
    data: tagTree,
  } = useTagTree();

  const autoSave = useFieldAutoSave<UpdateNewsletterInput, Newsletter>({
    id: newsletter.id,
    update: updateNewsletter,
    labels: LABELS,
    initial: {
      name: newsletter.name,
      categoryId: newsletter.category?.id ?? null,
      mediaTypeId: newsletter.mediaTypeId ?? null,
      tagIds: newsletter.tagIds ?? [],
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: newsletter.name,
    },
    validators: {
      onChange: newsletterGeneralSchema,
    },
  });

  function saveTagIds(next: string[]): void {
    setTagIds(next);
    autoSave.saveField("tagIds", next);
  }

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label="Newsletter name"
            onBlur={() => autoSave.saveField(
              "name",
              field.state.value.trim(),
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug && updated.slug !== newsletter.slug) {
                    void navigate({
                      to: "/taxonomies/newsletters/$newsletterSlug/edit/general",
                      params: {
                        newsletterSlug: updated.slug,
                      },
                    });
                  }
                },
              },
            )}
          />
        )}
      </form.AppField>

      <SourceDefaultFields
        initialCategoryId={newsletter.category?.id ?? null}
        initialMediaTypeId={newsletter.mediaTypeId ?? null}
        categoryLabel="Default category"
        mediaTypeLabel="Default media type"
        categoryOptions={iconComboboxOptions(categories ?? [])}
        mediaTypeOptions={mediaTypeTreeComboboxOptions(mediaTypeTree ?? [])}
        onCategoryChange={id => autoSave.saveField("categoryId", id)}
        onMediaTypeChange={id => autoSave.saveField("mediaTypeId", id)}
        note="Category and media type applied automatically to bookmarks imported from this newsletter."
      />

      <Separator />

      <DefaultTagsField
        tree={tagTree ?? []}
        selectedIds={tagIds}
        onToggle={id => saveTagIds(tagIds.includes(id) ? tagIds.filter(t => t !== id) : [...tagIds, id])}
        description="Tags applied automatically to bookmarks imported from this newsletter."
      />
    </div>
  );
}
