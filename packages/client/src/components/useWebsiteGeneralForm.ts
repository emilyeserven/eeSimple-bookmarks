import type { UpdateWebsiteInput, Website } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { useWebsiteGeneralFormData } from "./useWebsiteGeneralFormData";
import { WEBSITE_LABELS, websiteAutoSaveInitial, websiteGeneralSchema } from "./websiteGeneralForm";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import {
  useAutoWebsiteFavicon,
  useDeleteWebsiteFavicon,
  useUpdateWebsite,
  useUploadWebsiteFavicon,
} from "@/hooks/useWebsites";
import { useAppForm } from "@/lib/form";

/** Re-exported for consumers; the canonical definition lives in `./websiteGeneralForm`. */
export { websiteAutoSaveInitial };

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
    categoryOptions, mediaTypeOptions, tagTree, youtubeChannels,
  } = useWebsiteGeneralFormData();

  const autoSave = useFieldAutoSave<UpdateWebsiteInput, Website>({
    id: website.id,
    update: updateWebsite,
    labels: WEBSITE_LABELS,
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
    categoryOptions,
    mediaTypeOptions,
    tagTree,
    youtubeChannels,
  };
}
