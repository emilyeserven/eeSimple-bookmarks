import type { SocialLink, Website } from "@eesimple/types";

import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DefaultTagsField } from "./DefaultTagsField";
import { EntityImageField } from "./EntityImageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { LabeledWebsitesField } from "./LabeledWebsitesField";
import { SelfIdsField } from "./SelfIdsField";
import { SocialLinksField } from "./SocialLinksField";
import { CategoryDefaultField, MediaTypeDefaultField } from "./SourceDefaultFields";
import { WebsiteGeneralFormProvider, useWebsiteGeneralFormContext } from "./WebsiteGeneralFormContext";
import { WebsiteRedirectFailureField } from "./WebsiteRedirectFailureField";
import { WebsiteYouTubeChannelsField } from "./WebsiteYouTubeChannelsField";

interface Props {
  website: Website;
}

/**
 * The granular website General **edit** fields (#1188 field extraction). Each is a placeable
 * {@link import("./workbench/types").WorkbenchField} `edit` renderer that reads the **one** shared
 * controller from {@link WebsiteGeneralFormProvider} (mounted by `EntityEditView`) and renders the
 * existing sub-component with props from `ctrl`, so the per-field auto-save + slug-follow-on-rename are
 * unchanged. `WebsiteGeneralForm` at the bottom recomposes them (inside the provider) for the story/test.
 */

/** Site name (+ the built-in banner). */
export function WebsiteNameEditField({
  website,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    ctrl: {
      form, saveSiteName,
    },
  } = useWebsiteGeneralFormContext();
  return (
    <div className="space-y-4">
      {website.builtIn
        ? (
          <p className="text-sm text-muted-foreground">
            {t("Built-in site — its name and domain are fixed.")}
          </p>
        )
        : null}
      <form.AppField name="siteName">
        {field => (
          <field.TextField
            label={t("Site name")}
            disabled={website.builtIn}
            onBlur={() => saveSiteName(field.state.value, field.state.meta.errors.length === 0)}
          />
        )}
      </form.AppField>
    </div>
  );
}

/** Domain (drives the slug — the save follows a rename). */
export function WebsiteDomainEditField({
  website,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    ctrl: {
      form, saveDomain,
    },
  } = useWebsiteGeneralFormContext();
  return (
    <form.AppField name="domain">
      {field => (
        <field.TextField
          label={t("Domain")}
          disabled={website.builtIn}
          onBlur={() => saveDomain(field.state.value, field.state.meta.errors.length === 0)}
        />
      )}
    </form.AppField>
  );
}

/** Description. */
export function WebsiteDescriptionEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl: {
      form, saveField,
    },
  } = useWebsiteGeneralFormContext();
  return (
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
  );
}

/** Alternate names (title-stripping list). */
export function WebsiteAlternateNamesEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl: {
      alternateNames, newAlternateName, setNewAlternateName, addAlternateName, removeAlternateName,
    },
  } = useWebsiteGeneralFormContext();
  return (
    <SelfIdsField
      selfIds={alternateNames}
      newSelfId={newAlternateName}
      onNewSelfIdChange={setNewAlternateName}
      onAdd={addAlternateName}
      onRemove={removeAlternateName}
      label={t("Alternate Names")}
      description={t("Extra names this site appends to titles (e.g. \"Example\", \"EN\"). Stripped automatically when a bookmark title is fetched.")}
    />
  );
}

/** Favicon (upload / auto-fetch / remove). */
export function WebsiteFaviconEditField({
  website,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    ctrl: {
      faviconBusy, uploadFavicon, autoFavicon, deleteFavicon,
    },
  } = useWebsiteGeneralFormContext();
  return (
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
  );
}

/** Default category applied to bookmarks saved from this site. */
export function WebsiteDefaultCategoryEditField({
  website,
}: Props) {
  const {
    ctrl: {
      categoryOptions, saveField,
    },
  } = useWebsiteGeneralFormContext();
  return (
    <CategoryDefaultField
      initialCategoryId={website.category?.id ?? null}
      categoryOptions={categoryOptions}
      onCategoryChange={id => saveField("categoryId", id)}
    />
  );
}

/** Default media type applied to bookmarks saved from this site. */
export function WebsiteDefaultMediaTypeEditField({
  website,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    ctrl: {
      mediaTypeOptions, saveField,
    },
  } = useWebsiteGeneralFormContext();
  return (
    <div className="space-y-1">
      <MediaTypeDefaultField
        initialMediaTypeId={website.mediaTypeId ?? null}
        mediaTypeOptions={mediaTypeOptions}
        onMediaTypeChange={id => saveField("mediaTypeId", id)}
      />
      <p className="text-sm text-muted-foreground">
        {t("Media type applied automatically to bookmarks saved from this site.")}
      </p>
    </div>
  );
}

/** Default tags applied to bookmarks saved from this site. */
export function WebsiteDefaultTagsEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl: {
      tagTree, tagIds, toggleTag,
    },
  } = useWebsiteGeneralFormContext();
  return (
    <DefaultTagsField
      tree={tagTree}
      selectedIds={tagIds}
      onToggle={toggleTag}
      description={t("Tags applied automatically to bookmarks saved from this site.")}
    />
  );
}

/** Associated YouTube channels. */
export function WebsiteYouTubeChannelsEditField({
  website,
}: Props) {
  const {
    ctrl: {
      youtubeChannels, saveField,
    },
  } = useWebsiteGeneralFormContext();
  return (
    <WebsiteYouTubeChannelsField
      channels={youtubeChannels}
      selectedIds={website.youtubeChannelIds ?? []}
      onChange={ids => saveField("youtubeChannelIds", ids)}
    />
  );
}

/** Social media links. */
export function WebsiteSocialLinksEditField({
  website,
}: Props) {
  const {
    ctrl: {
      saveField,
    },
  } = useWebsiteGeneralFormContext();
  return (
    <SocialLinksField
      socialLinks={website.socialLinks}
      onChange={(links: SocialLink[]) => saveField("socialLinks", links)}
    />
  );
}

/** Labeled related websites. */
export function WebsiteLabeledWebsitesEditField({
  website,
}: Props) {
  const {
    ctrl: {
      saveField,
    },
  } = useWebsiteGeneralFormContext();
  return (
    <LabeledWebsitesField
      labeledWebsites={website.labeledWebsites}
      onChange={websites => saveField("labeledWebsites", websites)}
    />
  );
}

/** Redirect-resolution-failure flag. */
export function WebsiteRedirectFailureEditField({
  website,
}: Props) {
  const {
    ctrl: {
      saveField,
    },
  } = useWebsiteGeneralFormContext();
  return (
    <WebsiteRedirectFailureField
      checked={website.redirectResolutionFailure ?? false}
      onCheckedChange={checked => saveField("redirectResolutionFailure", checked)}
    />
  );
}

/**
 * The full website General edit form, recomposed from the granular {@link WebsiteNameEditField} … fields
 * inside the shared {@link WebsiteGeneralFormProvider}. The Page Layouts path renders these fields
 * individually from the registry; this recomposition keeps the story/test rendering the whole form
 * unchanged. Each field auto-saves (no Save button).
 */
export function WebsiteGeneralForm({
  website,
}: Props) {
  return (
    <WebsiteGeneralFormProvider website={website}>
      <div className="space-y-6">
        <WebsiteNameEditField website={website} />
        <WebsiteFaviconEditField website={website} />
        <WebsiteDomainEditField website={website} />
        <WebsiteDescriptionEditField />
        <WebsiteAlternateNamesEditField />
        <WebsiteDefaultCategoryEditField website={website} />
        <WebsiteDefaultMediaTypeEditField website={website} />
        <WebsiteDefaultTagsEditField />
        <WebsiteYouTubeChannelsEditField website={website} />
        <WebsiteSocialLinksEditField website={website} />
        <WebsiteLabeledWebsitesEditField website={website} />
        <WebsiteRedirectFailureEditField website={website} />
        <GenreMoodAssignmentSection
          ownerType="website"
          ownerId={website.id}
        />
      </div>
    </WebsiteGeneralFormProvider>
  );
}
