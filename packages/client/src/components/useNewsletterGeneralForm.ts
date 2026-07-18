import type { Newsletter, UpdateNewsletterInput } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateNewsletter } from "../hooks/useNewsletters";

import { useCategories } from "@/hooks/useCategories";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import { useBuiltInName } from "@/lib/builtInName";
import { iconComboboxOptions, mediaTypeNodesToOptions } from "@/lib/comboboxOptions";
import { sortFavoritesFirst } from "@/lib/favoritesOrder";
import { useAppForm } from "@/lib/form";

const LABELS: Partial<Record<keyof UpdateNewsletterInput, string>> = {
  name: "Name",
  description: "Description",
  categoryId: "Category",
  mediaTypeId: "Media type",
  tagIds: "Default tags",
};

/**
 * Owns the stateful pieces of the newsletter General (edit) form: the autosave engine, the local
 * tag state, the taxonomy queries (returned as combobox options), and the field-save handlers.
 * Returns one bag so `NewsletterGeneralForm` stays a presentational shell.
 */
export function useNewsletterGeneralForm(newsletter: Newsletter) {
  const {
    t,
  } = useTranslation();
  const newsletterGeneralSchema = z.object({
    name: z.string().trim().min(1, t("Name is required")),
    description: z.string(),
  });
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
      description: newsletter.description ?? null,
      categoryId: newsletter.category?.id ?? null,
      mediaTypeId: newsletter.mediaTypeId ?? null,
      tagIds: newsletter.tagIds ?? [],
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: newsletter.name,
      description: newsletter.description ?? "",
    },
    validators: {
      onChange: newsletterGeneralSchema,
    },
  });

  function saveName(value: string, valid: boolean): void {
    autoSave.saveField("name", value.trim(), {
      valid,
      // Renaming changes the slug; follow it so the edit page keeps resolving.
      onSuccess: (updated) => {
        if (updated.slug && updated.slug !== newsletter.slug) {
          void navigate({
            to: "/taxonomies/newsletters/$newsletterSlug/edit",
            params: {
              newsletterSlug: updated.slug,
            },
          });
        }
      },
    });
  }

  function saveDescription(value: string, valid: boolean): void {
    autoSave.saveField("description", value.trim() || null, {
      valid,
    });
  }

  function saveTagIds(next: string[]): void {
    setTagIds(next);
    autoSave.saveField("tagIds", next);
  }

  function toggleTag(id: string): void {
    saveTagIds(tagIds.includes(id) ? tagIds.filter(t => t !== id) : [...tagIds, id]);
  }

  const builtInName = useBuiltInName();

  return {
    form,
    tagIds,
    saveName,
    saveDescription,
    toggleTag,
    saveCategoryId: (id: string | null) => autoSave.saveField("categoryId", id),
    saveMediaTypeId: (id: string | null) => autoSave.saveField("mediaTypeId", id),
    categoryOptions: iconComboboxOptions(sortFavoritesFirst(categories ?? [])),
    mediaTypeOptions: mediaTypeNodesToOptions(mediaTypeTree ?? [], builtInName),
    tagTree: tagTree ?? [],
  };
}
