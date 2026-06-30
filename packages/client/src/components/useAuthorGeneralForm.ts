import type { Author, SocialLink, UpdateAuthorInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import {
  useAdoptChannelImageForAuthor,
  useAdoptWebsiteFaviconForAuthor,
  useAutoAuthorImage,
  useDeleteAuthorImage,
  useDetectAuthorSocialLinks,
  useUpdateAuthor,
  useUploadAuthorImage,
} from "../hooks/useAuthors";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { useAppForm } from "../lib/form";
import { notifySuccess } from "../lib/notifications";
import { SOCIAL_MEDIA_PLATFORM_LABELS, socialLinkSchema } from "../lib/socialLinks";

const authorGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  romanizedName: z.string(),
  authorWebsiteUrl: z.string(),
  biographyUrl: z.string(),
  socialLinks: z.array(socialLinkSchema),
});

const LABELS: Partial<Record<keyof UpdateAuthorInput, string>> = {
  name: "Name",
  romanizedName: "Romanized name",
  authorWebsiteUrl: "Author website",
  biographyUrl: "Biography URL",
  socialLinks: "Social media links",
};

/**
 * Owns the stateful pieces of the author General (edit) form: the avatar mutations, the autosave
 * engine, the taxonomy queries (resolved to the connected channels/websites with images), and the
 * field-save + social-link-detection handlers. Returns one bag so `AuthorGeneralForm` stays a
 * presentational shell.
 */
export function useAuthorGeneralForm(author: Author) {
  const navigate = useNavigate();
  const update = useUpdateAuthor();
  const uploadAvatar = useUploadAuthorImage();
  const autoAvatar = useAutoAuthorImage();
  const deleteAvatar = useDeleteAuthorImage();
  const adoptChannel = useAdoptChannelImageForAuthor();
  const adoptWebsite = useAdoptWebsiteFaviconForAuthor();
  const detectLinks = useDetectAuthorSocialLinks();
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
    ch => author.youtubeChannelIds.includes(ch.id) && ch.imageUrl,
  );
  const connectedWebsitesWithImage = (websites ?? []).filter(
    site => author.websiteIds.includes(site.id) && site.imageUrl,
  );

  const autoSave = useFieldAutoSave<UpdateAuthorInput, Author>({
    id: author.id,
    update,
    labels: LABELS,
    initial: {
      name: author.name,
      romanizedName: author.romanizedName ?? "",
      authorWebsiteUrl: author.authorWebsiteUrl,
      biographyUrl: author.biographyUrl,
      socialLinks: author.socialLinks,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: author.name,
      romanizedName: author.romanizedName ?? "",
      authorWebsiteUrl: author.authorWebsiteUrl ?? "",
      biographyUrl: author.biographyUrl ?? "",
    },
    validators: {
      onChange: authorGeneralSchema,
    },
  });

  function saveName(value: string, valid: boolean): void {
    autoSave.saveField("name", value.trim(), {
      valid,
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
    });
  }

  function detectSocialLinks(): void {
    detectLinks.mutate(author.id, {
      onSuccess: ({
        detected,
      }) => {
        if (detected.length === 0) {
          notifySuccess("No new social links found on the author's website");
          return;
        }
        const existingPlatforms = new Set(author.socialLinks.map(l => l.platform));
        const toAdd = detected.filter(l => !existingPlatforms.has(l.platform));
        if (toAdd.length === 0) {
          notifySuccess("Social links already up to date");
          return;
        }
        const merged = [...author.socialLinks, ...toAdd];
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
