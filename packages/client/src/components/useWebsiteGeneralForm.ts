import type { UpdateWebsiteInput, Website } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { useCategories } from "@/hooks/useCategories";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import {
  useAutoWebsiteFavicon,
  useDeleteWebsiteFavicon,
  useUpdateWebsite,
  useUploadWebsiteFavicon,
} from "@/hooks/useWebsites";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { iconComboboxOptions, mediaTypeTreeComboboxOptions } from "@/lib/comboboxOptions";
import { useAppForm } from "@/lib/form";
import { socialLinkSchema } from "@/lib/socialLinks";

const websiteGeneralSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required"),
  domain: z.string().trim().min(1, "Domain is required"),
  socialLinks: z.array(socialLinkSchema),
});

const LABELS: Partial<Record<keyof UpdateWebsiteInput, string>> = {
  siteName: "Site name",
  domain: "Domain",
  categoryId: "Category",
  mediaTypeId: "Media type",
  tagIds: "Default tags",
  socialLinks: "Social media links",
  youtubeChannelIds: "YouTube channels",
  alternateNames: "Alternate names",
  redirectResolutionFailure: "Redirect resolution failure",
};

/** The autosave snapshot for a website's editable fields, with all nullable defaults applied. */
export function websiteAutoSaveInitial(website: Website): UpdateWebsiteInput {
  return {
    siteName: website.siteName,
    domain: website.domain,
    categoryId: website.category?.id ?? null,
    mediaTypeId: website.mediaTypeId ?? null,
    tagIds: website.tagIds ?? [],
    socialLinks: website.socialLinks,
    youtubeChannelIds: website.youtubeChannelIds ?? [],
    alternateNames: website.alternateNames,
    redirectResolutionFailure: website.redirectResolutionFailure ?? false,
  };
}

/**
 * Owns every stateful piece of the website General (edit) form: the favicon mutations, the local
 * alternate-names + tag state, the taxonomy queries (returned with defaults applied), the autosave
 * engine, and the field-save handlers. Returns one bag so `WebsiteGeneralForm` stays a presentational
 * shell, mirroring `useBookmarkGeneralForm`.
 */
export function useWebsiteGeneralForm(website: Website) {
  const navigate = useNavigate();
  const updateWebsite = useUpdateWebsite();
  const uploadFavicon = useUploadWebsiteFavicon();
  const autoFavicon = useAutoWebsiteFavicon();
  const deleteFavicon = useDeleteWebsiteFavicon();
  const faviconBusy = uploadFavicon.isPending || autoFavicon.isPending || deleteFavicon.isPending;
  const [tagIds, setTagIds] = useState<string[]>(website.tagIds ?? []);
  const [alternateNames, setAlternateNames] = useState<string[]>(website.alternateNames ?? []);
  const [newAlternateName, setNewAlternateName] = useState("");
  const {
    data: categories,
  } = useCategories();
  const {
    data: mediaTypeTree,
  } = useMediaTypeTree();
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: youtubeChannels,
  } = useYouTubeChannels();

  const autoSave = useFieldAutoSave<UpdateWebsiteInput, Website>({
    id: website.id,
    update: updateWebsite,
    labels: LABELS,
    initial: websiteAutoSaveInitial(website),
  });

  const form = useAppForm({
    defaultValues: {
      siteName: website.siteName,
      domain: website.domain,
    },
    validators: {
      onChange: websiteGeneralSchema,
    },
  });

  function saveSiteName(value: string, valid: boolean): void {
    autoSave.saveField("siteName", value.trim(), {
      valid,
    });
  }

  function saveDomain(value: string, valid: boolean): void {
    autoSave.saveField("domain", value.trim(), {
      valid,
      // Changing the domain may change the slug; follow it so the edit page keeps resolving.
      onSuccess: (updated) => {
        if (updated.slug && updated.slug !== website.slug) {
          void navigate({
            to: "/taxonomies/websites/$websiteSlug/edit/general",
            params: {
              websiteSlug: updated.slug,
            },
          });
        }
      },
    });
  }

  function saveTagIds(next: string[]): void {
    setTagIds(next);
    autoSave.saveField("tagIds", next);
  }

  function toggleTag(id: string): void {
    saveTagIds(tagIds.includes(id) ? tagIds.filter(t => t !== id) : [...tagIds, id]);
  }

  function addAlternateName(): void {
    const trimmed = newAlternateName.trim();
    if (!trimmed || alternateNames.includes(trimmed)) return;
    const next = [...alternateNames, trimmed];
    setAlternateNames(next);
    setNewAlternateName("");
    autoSave.saveField("alternateNames", next);
  }

  function removeAlternateName(name: string): void {
    const next = alternateNames.filter(n => n !== name);
    setAlternateNames(next);
    autoSave.saveField("alternateNames", next);
  }

  return {
    form,
    faviconBusy,
    tagIds,
    alternateNames,
    newAlternateName,
    setNewAlternateName,
    saveField: autoSave.saveField,
    saveSiteName,
    saveDomain,
    toggleTag,
    addAlternateName,
    removeAlternateName,
    uploadFavicon,
    autoFavicon,
    deleteFavicon,
    categoryOptions: iconComboboxOptions(categories ?? []),
    mediaTypeOptions: mediaTypeTreeComboboxOptions(mediaTypeTree ?? []),
    tagTree: tagTree ?? [],
    youtubeChannels: youtubeChannels ?? [],
  };
}
