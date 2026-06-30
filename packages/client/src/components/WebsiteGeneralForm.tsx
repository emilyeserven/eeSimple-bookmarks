import type { SocialLink, Website } from "@eesimple/types";

import { Globe } from "lucide-react";

import { DefaultTagsField } from "./DefaultTagsField";
import { EntityImageField } from "./EntityImageField";
import { SelfIdsField } from "./SelfIdsField";
import { SocialLinksField } from "./SocialLinksField";
import { SourceDefaultFields } from "./SourceDefaultFields";
import { useWebsiteGeneralForm } from "./useWebsiteGeneralForm";
import { WebsiteRedirectFailureField } from "./WebsiteRedirectFailureField";
import { WebsiteYouTubeChannelsField } from "./WebsiteYouTubeChannelsField";

import { Separator } from "@/components/ui/separator";

interface Props {
  website: Website;
}

/** Edit a website's site name, domain, category, and default tags. Each field auto-saves (no Save button). */
export function WebsiteGeneralForm({
  website,
}: Props) {
  const {
    form, faviconBusy, tagIds, alternateNames, newAlternateName, setNewAlternateName,
    saveField, saveSiteName, saveDomain, toggleTag, addAlternateName, removeAlternateName,
    uploadFavicon, autoFavicon, deleteFavicon, categoryOptions, mediaTypeOptions, tagTree, youtubeChannels,
  } = useWebsiteGeneralForm(website);

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
              onBlur={() => saveSiteName(field.state.value, field.state.meta.errors.length === 0)}
            />
          )}
        </form.AppField>
        <form.AppField name="domain">
          {field => (
            <field.TextField
              label="Domain"
              disabled={website.builtIn}
              onBlur={() => saveDomain(field.state.value, field.state.meta.errors.length === 0)}
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
        categoryOptions={categoryOptions}
        mediaTypeOptions={mediaTypeOptions}
        onCategoryChange={id => saveField("categoryId", id)}
        onMediaTypeChange={id => saveField("mediaTypeId", id)}
        note="Media type applied automatically to bookmarks saved from this site."
      />

      <Separator />

      <DefaultTagsField
        tree={tagTree}
        selectedIds={tagIds}
        onToggle={toggleTag}
        description="Tags applied automatically to bookmarks saved from this site."
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

      <WebsiteRedirectFailureField
        checked={website.redirectResolutionFailure ?? false}
        onCheckedChange={checked => saveField("redirectResolutionFailure", checked)}
      />
    </div>
  );
}
