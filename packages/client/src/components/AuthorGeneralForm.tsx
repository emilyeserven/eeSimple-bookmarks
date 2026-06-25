import type { Author, SocialLink, UpdateAuthorInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { Globe, MonitorPlay, Sparkles, UserCircle } from "lucide-react";
import { z } from "zod";

import { EntityImageField } from "./EntityImageField";
import { SocialLinksField } from "./SocialLinksField";
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

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const authorGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  authorWebsiteUrl: z.string(),
  biographyUrl: z.string(),
  socialLinks: z.array(socialLinkSchema),
});

const LABELS: Partial<Record<keyof UpdateAuthorInput, string>> = {
  name: "Name",
  authorWebsiteUrl: "Author website",
  biographyUrl: "Biography URL",
  socialLinks: "Social media links",
};

interface Props {
  author: Author;
}

/** Edit an author's name, URLs, and avatar. Fields auto-save on blur (no Save button). */
export function AuthorGeneralForm({
  author,
}: Props) {
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
      authorWebsiteUrl: author.authorWebsiteUrl,
      biographyUrl: author.biographyUrl,
      socialLinks: author.socialLinks,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: author.name,
      authorWebsiteUrl: author.authorWebsiteUrl ?? "",
      biographyUrl: author.biographyUrl ?? "",
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

      <form.AppField name="authorWebsiteUrl">
        {field => (
          <field.TextField
            label="Author website URL"
            type="url"
            placeholder="https://example.com"
            onBlur={() => autoSave.saveField(
              "authorWebsiteUrl",
              field.state.value.trim() || null,
            )}
          />
        )}
      </form.AppField>

      <form.AppField name="biographyUrl">
        {field => (
          <field.TextField
            label="Biography URL"
            type="url"
            placeholder="https://example.com/bio"
            onBlur={() => autoSave.saveField(
              "biographyUrl",
              field.state.value.trim() || null,
            )}
          />
        )}
      </form.AppField>

      <EntityImageField
        label="Avatar"
        imageUrl={author.imageUrl}
        shape="circle"
        fallback={<UserCircle className="size-5" />}
        busy={avatarBusy}
        onUpload={file => uploadAvatar.mutate({
          id: author.id,
          file,
        })}
        onRemove={() => deleteAvatar.mutate(author.id)}
      />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={avatarBusy || !author.authorWebsiteUrl}
          onClick={() => autoAvatar.mutate({
            id: author.id,
            source: "website",
            sourceUrl: author.authorWebsiteUrl ?? undefined,
          })}
        >
          <Sparkles className="size-4" />
          Fetch from Author Website
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={avatarBusy || !author.biographyUrl}
          onClick={() => autoAvatar.mutate({
            id: author.id,
            source: "biography",
            sourceUrl: author.biographyUrl ?? undefined,
          })}
        >
          <Sparkles className="size-4" />
          Fetch from Biography
        </Button>
        {connectedChannelsWithImage.map(ch => (
          <Button
            key={ch.id}
            type="button"
            variant="outline"
            size="sm"
            disabled={avatarBusy}
            onClick={() => adoptChannel.mutate({
              id: author.id,
              channelId: ch.id,
            })}
          >
            <MonitorPlay className="size-4" />
            Use &ldquo;
            {ch.name}
            &rdquo; photo
          </Button>
        ))}
        {connectedWebsitesWithImage.map(site => (
          <Button
            key={site.id}
            type="button"
            variant="outline"
            size="sm"
            disabled={avatarBusy}
            onClick={() => adoptWebsite.mutate({
              id: author.id,
              websiteId: site.id,
            })}
          >
            <Globe className="size-4" />
            Use &ldquo;
            {site.siteName}
            &rdquo; favicon
          </Button>
        ))}
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={detectLinks.isPending || !author.authorWebsiteUrl}
          onClick={() => detectLinks.mutate(author.id, {
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
          })}
        >
          <Sparkles className="size-4" />
          Detect social links from website
        </Button>
      </div>

      <SocialLinksField
        socialLinks={author.socialLinks}
        onChange={(links: SocialLink[]) => autoSave.saveField("socialLinks", links)}
      />
    </div>
  );
}
