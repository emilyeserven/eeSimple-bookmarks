import type { SocialLink, UpdateWebsiteInput, Website } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { z } from "zod";

import { DefaultTagsField } from "./DefaultTagsField";
import { EntityImageField } from "./EntityImageField";
import { SelfIdsField } from "./SelfIdsField";
import { SocialLinksField } from "./SocialLinksField";
import { SourceDefaultFields } from "./SourceDefaultFields";
import { WebsiteYouTubeChannelsField } from "./WebsiteYouTubeChannelsField";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

interface Props {
  website: Website;
}

/** Edit a website's site name, domain, category, and default tags. Each field auto-saves (no Save button). */
export function WebsiteGeneralForm({
  website,
}: Props) {
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
    initial: {
      siteName: website.siteName,
      domain: website.domain,
      categoryId: website.category?.id ?? null,
      mediaTypeId: website.mediaTypeId ?? null,
      tagIds: website.tagIds ?? [],
      socialLinks: website.socialLinks,
      youtubeChannelIds: website.youtubeChannelIds ?? [],
      alternateNames: website.alternateNames,
      redirectResolutionFailure: website.redirectResolutionFailure ?? false,
    },
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

  function saveTagIds(next: string[]): void {
    setTagIds(next);
    autoSave.saveField("tagIds", next);
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

  return (
    <div className="space-y-4">
      {website.builtIn
        ? (
          <p className="text-sm text-muted-foreground">
            Built-in site — its name and domain are fixed.
          </p>
        )
        : null}

      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <form.AppField name="siteName">
          {field => (
            <field.TextField
              label="Site name"
              disabled={website.builtIn}
              onBlur={() => autoSave.saveField(
                "siteName",
                field.state.value.trim(),
                {
                  valid: field.state.meta.errors.length === 0,
                },
              )}
            />
          )}
        </form.AppField>
        <form.AppField name="domain">
          {field => (
            <field.TextField
              label="Domain"
              disabled={website.builtIn}
              onBlur={() => autoSave.saveField(
                "domain",
                field.state.value.trim(),
                {
                  valid: field.state.meta.errors.length === 0,
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
                },
              )}
            />
          )}
        </form.AppField>
      </div>

      <SelfIdsField
        selfIds={alternateNames}
        newSelfId={newAlternateName}
        onNewSelfIdChange={setNewAlternateName}
        onAdd={addAlternateName}
        onRemove={removeAlternateName}
        label="Alternate Names"
        description='Extra names this site appends to titles (e.g. "Example", "EN"). Stripped automatically when a bookmark title is fetched.'
      />

      <EntityImageField
        label="Favicon"
        imageUrl={website.imageUrl}
        shape="square"
        fallback={<Globe className="size-5" />}
        busy={faviconBusy}
        onUpload={file => uploadFavicon.mutate({
          id: website.id,
          file,
        })}
        onAuto={() => autoFavicon.mutate({
          id: website.id,
          sourceUrl: `https://${website.domain}`,
        })}
        autoLabel="Fetch favicon"
        autoError={website.faviconAutoGrabError ?? null}
        onRemove={() => deleteFavicon.mutate(website.id)}
      />

      <SourceDefaultFields
        initialCategoryId={website.category?.id ?? null}
        initialMediaTypeId={website.mediaTypeId ?? null}
        categoryOptions={iconComboboxOptions(categories ?? [])}
        mediaTypeOptions={mediaTypeTreeComboboxOptions(mediaTypeTree ?? [])}
        onCategoryChange={id => autoSave.saveField("categoryId", id)}
        onMediaTypeChange={id => autoSave.saveField("mediaTypeId", id)}
        note="Media type applied automatically to bookmarks saved from this site."
      />

      <Separator />

      <DefaultTagsField
        tree={tagTree ?? []}
        selectedIds={tagIds}
        onToggle={id => saveTagIds(tagIds.includes(id) ? tagIds.filter(t => t !== id) : [...tagIds, id])}
        description="Tags applied automatically to bookmarks saved from this site."
      />

      <Separator />

      <WebsiteYouTubeChannelsField
        channels={youtubeChannels ?? []}
        selectedIds={website.youtubeChannelIds ?? []}
        onChange={ids => autoSave.saveField("youtubeChannelIds", ids)}
      />

      <Separator />

      <SocialLinksField
        socialLinks={website.socialLinks}
        onChange={(links: SocialLink[]) => autoSave.saveField("socialLinks", links)}
      />

      <Separator />

      <div className="flex items-start gap-3">
        <Checkbox
          id="redirect-resolution-failure"
          checked={website.redirectResolutionFailure ?? false}
          onCheckedChange={checked => autoSave.saveField("redirectResolutionFailure", checked === true)}
        />
        <div className="space-y-1">
          <Label htmlFor="redirect-resolution-failure">Redirect resolution failure</Label>
          <p className="text-sm text-muted-foreground">
            Flag this site when its redirects resolve unreliably. Flagged bookmarks appear in
            Settings → Redirect Failures for URL correction.
          </p>
        </div>
      </div>
    </div>
  );
}
