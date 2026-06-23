import type { Newsletter, UpdateNewsletterInput } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { AddCategoryModal } from "./AddCategoryModal";
import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { DefaultTagsField } from "./DefaultTagsField";
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
  categoryId: z.string().nullable(),
  mediaTypeId: z.string().nullable(),
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
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addMediaTypeOpen, setAddMediaTypeOpen] = useState(false);
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
      categoryId: newsletter.category?.id ?? null,
      mediaTypeId: newsletter.mediaTypeId ?? null,
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

      <form.AppField name="categoryId">
        {field => (
          <field.ComboboxField
            label="Default category"
            placeholder="No category"
            searchPlaceholder="Search categories…"
            emptyText="No categories found."
            options={iconComboboxOptions(categories ?? [])}
            createOption={{
              label: "Create category",
              onSelect: () => setAddCategoryOpen(true),
            }}
            onValueChange={value => autoSave.saveField("categoryId", value || null)}
          />
        )}
      </form.AppField>
      <AddCategoryModal
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onCreated={category => form.setFieldValue("categoryId", category.id)}
      />

      <form.AppField name="mediaTypeId">
        {field => (
          <field.ComboboxField
            label="Default media type"
            placeholder="No media type"
            searchPlaceholder="Search media types…"
            emptyText="No media types found."
            options={mediaTypeTreeComboboxOptions(mediaTypeTree ?? [])}
            createOption={{
              label: "Create media type",
              onSelect: () => setAddMediaTypeOpen(true),
            }}
            onValueChange={value => autoSave.saveField("mediaTypeId", value || null)}
          />
        )}
      </form.AppField>
      <AddMediaTypeModal
        open={addMediaTypeOpen}
        onOpenChange={setAddMediaTypeOpen}
        onCreated={mediaType => form.setFieldValue("mediaTypeId", mediaType.id)}
      />
      <p className="text-sm text-muted-foreground">
        Category and media type applied automatically to bookmarks imported from this newsletter.
      </p>

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
