import type { Person, SocialLink, UpdatePersonInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import {
  useAdoptChannelImageForPerson,
  useAdoptWebsiteFaviconForPerson,
  useAutoPersonImage,
  useDeletePersonImage,
  useDetectPersonSocialLinks,
  useUpdatePerson,
  useUploadPersonImage,
} from "../hooks/usePeople";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { useAppForm } from "../lib/form";
import { notifySuccess } from "../lib/notifications";
import { SOCIAL_MEDIA_PLATFORM_LABELS, socialLinkSchema } from "../lib/socialLinks";

const personGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  romanizedName: z.string(),
  personWebsiteUrl: z.string(),
  biographyUrl: z.string(),
  socialLinks: z.array(socialLinkSchema),
});

const LABELS: Partial<Record<keyof UpdatePersonInput, string>> = {
  name: "Name",
  romanizedName: "Romanized name",
  personWebsiteUrl: "Person website",
  biographyUrl: "Biography URL",
  socialLinks: "Social media links",
};

/**
 * Owns the stateful pieces of the person General (edit) form: the avatar mutations, the autosave
 * engine, the taxonomy queries (resolved to the connected channels/websites with images), and the
 * field-save + social-link-detection handlers. Returns one bag so `PersonGeneralForm` stays a
 * presentational shell.
 */
export function usePersonGeneralForm(person: Person) {
  const navigate = useNavigate();
  const {
    t,
  } = useTranslation();
  const update = useUpdatePerson();
  const uploadAvatar = useUploadPersonImage();
  const autoAvatar = useAutoPersonImage();
  const deleteAvatar = useDeletePersonImage();
  const adoptChannel = useAdoptChannelImageForPerson();
  const adoptWebsite = useAdoptWebsiteFaviconForPerson();
  const detectLinks = useDetectPersonSocialLinks();
  const avatarBusy
    = uploadAvatar.isPending
      || autoAvatar.isPending
      || deleteAvatar.isPending
      || adoptChannel.isPending
      || adoptWebsite.isPending;

  const {
    data: channels,
  } = useYouTubeChannels();
  const {
    data: websites,
  } = useWebsites();

  const connectedChannelsWithImage = (channels ?? []).filter(
    ch => person.youtubeChannelIds.includes(ch.id) && ch.imageUrl,
  );
  const connectedWebsitesWithImage = (websites ?? []).filter(
    site => person.websiteIds.includes(site.id) && site.imageUrl,
  );

  const autoSave = useFieldAutoSave<UpdatePersonInput, Person>({
    id: person.id,
    update,
    labels: LABELS,
    initial: {
      name: person.name,
      romanizedName: person.romanizedName ?? "",
      personWebsiteUrl: person.personWebsiteUrl,
      biographyUrl: person.biographyUrl,
      socialLinks: person.socialLinks,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: person.name,
      romanizedName: person.romanizedName ?? "",
      personWebsiteUrl: person.personWebsiteUrl ?? "",
      biographyUrl: person.biographyUrl ?? "",
    },
    validators: {
      onChange: personGeneralSchema,
    },
  });

  function saveName(value: string, valid: boolean): void {
    autoSave.saveField("name", value.trim(), {
      valid,
      // Renaming changes the slug; follow it so the edit page keeps resolving.
      onSuccess: (updated) => {
        if (updated.slug !== person.slug) {
          void navigate({
            to: "/taxonomies/people/$personSlug/edit/general",
            params: {
              personSlug: updated.slug,
            },
          });
        }
      },
    });
  }

  function detectSocialLinks(): void {
    detectLinks.mutate(person.id, {
      onSuccess: ({
        detected,
      }) => {
        if (detected.length === 0) {
          notifySuccess(t("No new social links found on the person's website"));
          return;
        }
        const existingPlatforms = new Set(person.socialLinks.map(l => l.platform));
        const toAdd = detected.filter(l => !existingPlatforms.has(l.platform));
        if (toAdd.length === 0) {
          notifySuccess(t("Social links already up to date"));
          return;
        }
        const merged = [...person.socialLinks, ...toAdd];
        autoSave.saveField("socialLinks", merged);
        const names = toAdd.map(l => SOCIAL_MEDIA_PLATFORM_LABELS[l.platform]).join(", ");
        notifySuccess(`Found ${toAdd.length === 1 ? "a link" : "links"}: ${names}`);
      },
    });
  }

  return {
    form,
    avatarBusy,
    uploadAvatar,
    autoAvatar,
    deleteAvatar,
    adoptChannel,
    adoptWebsite,
    detectLinks,
    connectedChannelsWithImage,
    connectedWebsitesWithImage,
    saveField: autoSave.saveField,
    saveName,
    detectSocialLinks,
    saveSocialLinks: (links: SocialLink[]) => autoSave.saveField("socialLinks", links),
  };
}
