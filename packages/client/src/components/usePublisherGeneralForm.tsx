import type { Publisher, UpdatePublisherInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { Globe, Library } from "lucide-react";
import { z } from "zod";

import { useEntityCreateOption } from "./useEntityCreateOption";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useMediaProperties } from "../hooks/useMediaProperties";
import { useUpdatePublisher } from "../hooks/usePublishers";
import { useWebsites } from "../hooks/useWebsites";
import { useAppForm } from "../lib/form";
import { socialLinkSchema } from "../lib/socialLinks";

const publisherGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  romanizedName: z.string(),
  websiteId: z.string().nullable(),
  mediaPropertyId: z.string().nullable(),
  socialLinks: z.array(socialLinkSchema),
});

const LABELS: Partial<Record<keyof UpdatePublisherInput, string>> = {
  name: "Name",
  romanizedName: "Romanized name",
  websiteId: "Website",
  mediaPropertyId: "Media property",
  socialLinks: "Social media links",
};

/**
 * Owns the stateful pieces of the publisher General (edit) form: the autosave engine, the website
 * picker options, the add-website modal state, and the autosave snapshot. Returns one bag so
 * `PublisherGeneralForm` stays a presentational shell.
 */
export function usePublisherGeneralForm(publisher: Publisher) {
  const navigate = useNavigate();
  const update = useUpdatePublisher();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: mediaProperties,
  } = useMediaProperties();

  const autoSave = useFieldAutoSave<UpdatePublisherInput, Publisher>({
    id: publisher.id,
    update,
    labels: LABELS,
    initial: {
      name: publisher.name,
      romanizedName: publisher.romanizedName ?? "",
      websiteId: publisher.websiteId ?? null,
      mediaPropertyId: publisher.mediaPropertyId ?? null,
      socialLinks: publisher.socialLinks,
    },
  });

  const websiteOptions = (websites ?? []).map(website => ({
    value: website.id,
    label: website.siteName,
    icon: (
      <Globe className="size-4 shrink-0 text-muted-foreground" />
    ),
  }));

  const mediaPropertyOptions = (mediaProperties ?? []).map(prop => ({
    value: prop.id,
    label: prop.name,
    icon: (
      <Library className="size-4 shrink-0 text-muted-foreground" />
    ),
  }));

  const form = useAppForm({
    defaultValues: {
      name: publisher.name,
      romanizedName: publisher.romanizedName ?? "",
      websiteId: publisher.websiteId ?? null,
      mediaPropertyId: publisher.mediaPropertyId ?? null,
    },
    validators: {
      onChange: publisherGeneralSchema,
    },
  });

  const websiteCreate = useEntityCreateOption("website", website => form.setFieldValue("websiteId", website.id));
  const mediaPropertyCreate = useEntityCreateOption(
    "media-property",
    mediaProperty => form.setFieldValue("mediaPropertyId", mediaProperty.id),
  );

  function saveName(value: string, valid: boolean): void {
    autoSave.saveField("name", value.trim(), {
      valid,
      // Renaming changes the slug; follow it so the edit page keeps resolving.
      onSuccess: (updated) => {
        if (updated.slug !== publisher.slug) {
          void navigate({
            to: "/taxonomies/publishers/$publisherSlug/edit/general",
            params: {
              publisherSlug: updated.slug,
            },
          });
        }
      },
    });
  }

  return {
    form,
    saveField: autoSave.saveField,
    saveName,
    websiteOptions,
    websiteCreate,
    mediaPropertyOptions,
    mediaPropertyCreate,
  };
}
