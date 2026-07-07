import type { SocialLink, Website } from "@eesimple/types";

import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DefaultTagsField } from "./DefaultTagsField";
import { EntityImageField } from "./EntityImageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { LabeledWebsitesField } from "./LabeledWebsitesField";
import { SelfIdsField } from "./SelfIdsField";
import { SocialLinksField } from "./SocialLinksField";
import { SourceDefaultFields } from "./SourceDefaultFields";
import { useWebsiteGeneralForm } from "./useWebsiteGeneralForm";
import { WebsiteRedirectFailureField } from "./WebsiteRedirectFailureField";
import { WebsiteYouTubeChannelsField } from "./WebsiteYouTubeChannelsField";
import { useImageTaxonomySyncRegistration } from "../hooks/useImageTaxonomySyncRegistration";

import { Separator } from "@/components/ui/separator";

interface Props {
  website: Website;
}

/** Edit a website's site name, domain, category, and default tags. Each field auto-saves (no Save button). */
export function WebsiteGeneralForm({
  website,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, faviconBusy, tagIds, alternateNames, newAlternateName, setNewAlternateName,
    saveField, saveSiteName, saveDomain, toggleTag, addAlternateName, removeAlternateName,
    uploadFavicon, autoFavicon, deleteFavicon, categoryOptions, mediaTypeOptions, tagTree, youtubeChannels,
  } = useWebsiteGeneralForm(website);

  // Register the header "Sync from source" button (preview + re-fetch the site favicon).
  useImageTaxonomySyncRegistration({
    entityId: website.id,
    entityLabel: website.siteName ?? website.domain,
    sourceLabel: t("Website"),
    previewKind: "website",
    currentImageUrl: website.imageUrl ?? null,
    applyImage: website.builtIn
      ? null
      : () => autoFavicon.mutate({
        id: website.id,
        sourceUrl: `https://${website.domain}`,
      }),
  });

  return (
    <div className="space-y-4">
      {website.builtIn
        ? (
          <p className="text-sm text-muted-foreground">
            {t("Built-in site — its name and domain are fixed.")}
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
              label={t("Site name")}
              disabled={website.builtIn}
              onBlur={() => saveSiteName(field.state.value, field.state.meta.errors.length === 0)}
            />
          )}
        </form.AppField>
        <form.AppField name="domain">
          {field => (
            <field.TextField
              label={t("Domain")}
              disabled={website.builtIn}
              onBlur={() => saveDomain(field.state.value, field.state.meta.errors.length === 0)}
            />
          )}
        </form.AppField>
        <form.AppField name="description">
          {field => (
            <field.TextareaField
              label={t("Description")}
              onBlur={() => saveField(
                "description",
                field.state.value.trim() || null,
                {
                  valid: field.state.meta.errors.length === 0,
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
        label={t("Alternate Names")}
        description={t("Extra names this site appends to titles (e.g. \"Example\", \"EN\"). Stripped automatically when a bookmark title is fetched.")}
      />

      <EntityImageField
        label={t("Favicon")}
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
        autoLabel={t("Fetch favicon")}
        autoError={website.faviconAutoGrabError ?? null}
        onRemove={() => deleteFavicon.mutate(website.id)}
      />

      <SourceDefaultFields
        initialCategoryId={website.category?.id ?? null}
        initialMediaTypeId={website.mediaTypeId ?? null}
        categoryOptions={categoryOptions}
        mediaTypeOptions={mediaTypeOptions}
        onCategoryChange={id => saveField("categoryId", id)}
        onMediaTypeChange={id => saveField("mediaTypeId", id)}
        note={t("Media type applied automatically to bookmarks saved from this site.")}
      />

      <Separator />

      <DefaultTagsField
        tree={tagTree}
        selectedIds={tagIds}
        onToggle={toggleTag}
        description={t("Tags applied automatically to bookmarks saved from this site.")}
        categoryId={website.category?.id ?? null}
      />

      <Separator />

      <WebsiteYouTubeChannelsField
        channels={youtubeChannels}
        selectedIds={website.youtubeChannelIds ?? []}
        onChange={ids => saveField("youtubeChannelIds", ids)}
      />

      <Separator />

      <SocialLinksField
        socialLinks={website.socialLinks}
        onChange={(links: SocialLink[]) => saveField("socialLinks", links)}
      />

      <Separator />

      <LabeledWebsitesField
        labeledWebsites={website.labeledWebsites}
        onChange={websites => saveField("labeledWebsites", websites)}
      />

      <Separator />

      <WebsiteRedirectFailureField
        checked={website.redirectResolutionFailure ?? false}
        onCheckedChange={checked => saveField("redirectResolutionFailure", checked)}
      />

      <Separator />

      <GenreMoodAssignmentSection
        ownerType="website"
        ownerId={website.id}
      />
    </div>
  );
}
