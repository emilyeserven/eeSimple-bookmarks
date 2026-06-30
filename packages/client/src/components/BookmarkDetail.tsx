import type { Bookmark, Category, CustomProperty, PropertyGroup } from "@eesimple/types";

import { youtubeEmbedUrl } from "@eesimple/types";

import { BookmarkArchiveLinkButton, BookmarkArchiveNowButton } from "./BookmarkCardActions";
import { BookmarkDetailBody } from "./BookmarkDetailBody";
import { BookmarkDetailMedia } from "./BookmarkDetailMedia";
import { BookmarkDetailTabbed } from "./BookmarkDetailTabbed";
import { BookmarkArchiveReelButton, BookmarkReelArchivePlayer } from "./BookmarkReelArchive";
import { DetailHeaderActions } from "./DetailHeaderActions";
import { RomanizedLabel } from "./RomanizedLabel";
import { useBookmarkDetailLayout } from "../hooks/useAppSettings";
import { useConnectors } from "../hooks/useConnectors";

interface BookmarkDetailProps {
  bookmark: Bookmark;
  /** All categories, used to resolve the bookmark's category name/icon/slug. */
  categories?: Category[];
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties?: CustomProperty[];
  /** Property groups, used to group property values under their group headings. */
  propertyGroups?: PropertyGroup[];
  onEdit?: () => void;
  onDelete?: () => void;
  /** When provided, boolean properties with `clickableInView` enabled render as toggles. */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
}

/**
 * The full view of a single bookmark, showing every field including each custom-property value.
 * Shared by the bookmark detail page and the right panel's bookmark view so the two stay identical.
 * Presentational: pass `categories`/`properties` for labels and `onEdit`/`onDelete` for actions.
 * The body renders as a single stacked column or vertical tabs per the `bookmarkDetailLayout` pref.
 */
export function BookmarkDetail({
  bookmark, categories = [], properties = [], propertyGroups = [], onEdit, onDelete, onSaveBoolean,
}: BookmarkDetailProps) {
  const layout = useBookmarkDetailLayout();
  const {
    data: connectors,
  } = useConnectors();

  // For YouTube bookmarks, show a playable embed in place of the static thumbnail.
  const embedUrl = youtubeEmbedUrl(bookmark.url ?? "");

  const isSingle = layout !== "tabbed";

  // ArchiveBox link-outs render only when the connector is configured and the bookmark has a url.
  const archiveBaseUrl = connectors?.archiveBox.baseUrl ?? null;
  const showArchive = archiveBaseUrl !== null && Boolean(bookmark.url);
  // Self-contained reel archiving needs both Browserless and object storage configured.
  const reelArchiveEnabled = connectors?.instagramReelArchive.enabled ?? false;

  return (
    <div className="@container space-y-6">
      {/* Shared header — identical in Single and Tabbed modes */}
      <div
        className="
          flex flex-col gap-6
          @2xl:flex-row @2xl:items-center
        "
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-bold">
              <a
                href={bookmark.url ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="
                  text-primary
                  hover:underline
                "
              >
                <RomanizedLabel
                  name={bookmark.title}
                  romanized={bookmark.romanizedTitle}
                />
              </a>
            </h1>
            <div className="flex items-center gap-1">
              {showArchive && archiveBaseUrl !== null && bookmark.url && (
                <>
                  <BookmarkArchiveLinkButton
                    baseUrl={archiveBaseUrl}
                    url={bookmark.url}
                  />
                  <BookmarkArchiveNowButton
                    baseUrl={archiveBaseUrl}
                    url={bookmark.url}
                  />
                </>
              )}
              <BookmarkArchiveReelButton
                bookmark={bookmark}
                enabled={reelArchiveEnabled}
              />
              <DetailHeaderActions
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </div>
          <a
            href={bookmark.url ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="
              block truncate text-sm text-muted-foreground
              hover:underline
            "
          >
            {bookmark.url}
          </a>
        </div>
        <BookmarkDetailMedia
          bookmark={bookmark}
          embedUrl={embedUrl}
        />
      </div>
      <BookmarkReelArchivePlayer bookmark={bookmark} />
      {isSingle
        ? (
          <BookmarkDetailBody
            bookmark={bookmark}
            categories={categories}
            properties={properties}
            propertyGroups={propertyGroups}
            onSaveBoolean={onSaveBoolean}
          />
        )
        : (
          <BookmarkDetailTabbed
            bookmark={bookmark}
            categories={categories}
            properties={properties}
            propertyGroups={propertyGroups}
            onSaveBoolean={onSaveBoolean}
          />
        )}

    </div>
  );
}
