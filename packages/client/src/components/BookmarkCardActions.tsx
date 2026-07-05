import type { Bookmark, BookmarkTag, ChoicesDisplayType, CustomProperty } from "@eesimple/types";

import { Archive, ArchiveRestore, BookOpen, ExternalLink, MoreVertical, Podcast, Tv } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkCardMenu } from "./BookmarkCardMenu";
import { useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { archiveAddUrl, archiveSearchUrl } from "../lib/archiveBox";
import { kavitaSeriesUrl } from "../lib/kavita";
import { plexItemUrl } from "../lib/plex";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { describeError } from "@/lib/apiError";
import { notifyFieldSaveError, notifyFieldSaved } from "@/lib/autoSave";

/** No-op fallback for the optional "More" menu handlers when a surface doesn't wire them. */
const noop = (): void => undefined;

/** The "open URL in a new tab" action button — a placeable card field and an image-corner overlay. */
export function BookmarkExternalLinkButton({
  url,
}: { url: string }) {
  const {
    t,
  } = useTranslation();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      asChild
    >
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={t("Open URL in new tab")}
      >
        <ExternalLink className="size-4" />
      </a>
    </Button>
  );
}

/**
 * "View archived page" action — opens the ArchiveBox public index pre-searched to the bookmark's
 * URL in a new tab. Caller renders it only when ArchiveBox is configured and the bookmark has a url.
 */
export function BookmarkArchiveLinkButton({
  baseUrl, url,
}: { baseUrl: string;
  url: string; }) {
  const {
    t,
  } = useTranslation();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      asChild
    >
      <a
        href={archiveSearchUrl(baseUrl, url)}
        target="_blank"
        rel="noreferrer"
        aria-label={t("View archived page in ArchiveBox")}
        title={t("View archived page in ArchiveBox")}
      >
        <Archive className="size-4" />
      </a>
    </Button>
  );
}

/**
 * "Archive now" action — opens the ArchiveBox add view pre-filled with the bookmark's URL in a new
 * tab to trigger a fresh snapshot. Caller renders it only when ArchiveBox is configured and the
 * bookmark has a url.
 */
export function BookmarkArchiveNowButton({
  baseUrl, url,
}: { baseUrl: string;
  url: string; }) {
  const {
    t,
  } = useTranslation();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      asChild
    >
      <a
        href={archiveAddUrl(baseUrl, url)}
        target="_blank"
        rel="noreferrer"
        aria-label={t("Archive this page now in ArchiveBox")}
        title={t("Archive this page now in ArchiveBox")}
      >
        <ArchiveRestore className="size-4" />
      </a>
    </Button>
  );
}

/**
 * "View on Kavita" action — opens the linked series' page in Kavita's web UI in a new tab. Caller
 * renders it only when the Kavita connector is configured and the bookmark is linked to a series.
 */
export function BookmarkKavitaLinkButton({
  baseUrl, libraryId, seriesId,
}: { baseUrl: string;
  libraryId: number;
  seriesId: number; }) {
  const {
    t,
  } = useTranslation();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      asChild
    >
      <a
        href={kavitaSeriesUrl(baseUrl, libraryId, seriesId)}
        target="_blank"
        rel="noreferrer"
        aria-label={t("View series on Kavita")}
        title={t("View series on Kavita")}
      >
        <BookOpen className="size-4" />
      </a>
    </Button>
  );
}

/**
 * "View on Plex" action — opens the linked item's page in Plex's web UI in a new tab. Caller renders
 * it only when the Plex connector is configured (with a known machineIdentifier) and the bookmark is
 * linked to an item.
 */
export function BookmarkPlexLinkButton({
  baseUrl, machineIdentifier, ratingKey,
}: { baseUrl: string;
  machineIdentifier: string;
  ratingKey: string; }) {
  const {
    t,
  } = useTranslation();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      asChild
    >
      <a
        href={plexItemUrl(baseUrl, machineIdentifier, ratingKey)}
        target="_blank"
        rel="noreferrer"
        aria-label={t("View item on Plex")}
        title={t("View item on Plex")}
      >
        <Tv className="size-4" />
      </a>
    </Button>
  );
}

/**
 * "View on {podcast service}" action — opens the linked podcast's default listening service (Apple
 * Podcasts / Spotify / Pocket Casts / RSS feed) in a new tab. Public URLs, so no connector gating;
 * caller renders it only when the bookmark's linked podcast resolves to a service URL.
 */
export function BookmarkPodcastLinkButton({
  url, label,
}: { url: string;
  label: string; }) {
  const {
    t,
  } = useTranslation();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      asChild
    >
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={t("View on {{label}}", {
          label,
        })}
        title={t("View on {{label}}", {
          label,
        })}
      >
        <Podcast className="size-4" />
      </a>
    </Button>
  );
}

/**
 * The "More" menu's editable-data + capture controls, threaded together so consumers (notably
 * {@link BookmarkCardDetails}) can pass them as one cohesive `menu` object rather than a dozen
 * individual props. `bookmark` is supplied separately by each renderer.
 */
export interface BookmarkCardMenuControls {
  editableProperties?: CustomProperty[];
  editableTags?: BookmarkTag[];
  autoImagePending?: boolean;
  onAutoImage?: () => void;
  screenshotPending?: boolean;
  onScreenshot?: () => void;
  onSaveNumber?: (propertyId: string, value: number) => void;
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
  onSaveDateTime?: (propertyId: string, value: string) => void;
  onSaveChoices?: (propertyId: string, values: string[]) => void;
  onSaveTags?: (tagIds: string[]) => void;
  onDelete?: (id: string) => void;
}

interface BookmarkMoreMenuProps extends BookmarkCardMenuControls {
  bookmark: Bookmark;
}

/** The "More options" menu (trigger + {@link BookmarkCardMenu}) — a placeable card field and overlay. */
export function BookmarkMoreMenu({
  bookmark, editableProperties = [], editableTags = [], autoImagePending = false, onAutoImage,
  screenshotPending = false, onScreenshot,
  onSaveNumber, onSaveBoolean, onSaveDateTime, onSaveChoices, onSaveTags, onDelete,
}: BookmarkMoreMenuProps) {
  const {
    t,
  } = useTranslation();
  const updateProperty = useUpdateCustomProperty();

  function handleChangeChoicesDisplay(propertyId: string, display: ChoicesDisplayType) {
    updateProperty.mutate(
      {
        id: propertyId,
        input: {
          choicesDisplay: display,
        },
      },
      {
        onSuccess: () => notifyFieldSaved(t("Display")),
        onError: error => notifyFieldSaveError(t("Display"), describeError(error)),
      },
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("More options")}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <BookmarkCardMenu
        bookmark={bookmark}
        editableProperties={editableProperties}
        editableTags={editableTags}
        autoImagePending={autoImagePending}
        onAutoImage={onAutoImage ?? noop}
        screenshotPending={screenshotPending}
        onScreenshot={onScreenshot ?? noop}
        onSaveNumber={onSaveNumber ?? noop}
        onSaveBoolean={onSaveBoolean ?? noop}
        onSaveDateTime={onSaveDateTime ?? noop}
        onSaveChoices={onSaveChoices ?? noop}
        onSaveTags={onSaveTags ?? noop}
        onChangeChoicesDisplay={handleChangeChoicesDisplay}
        onDelete={onDelete}
      />
    </DropdownMenu>
  );
}
