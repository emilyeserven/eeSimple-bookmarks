import type { BookmarkDetailImageSize, BookmarkDetailVideoSize } from "../stores/uiStore";
import type { Bookmark, Category, CustomProperty, PropertyGroup } from "@eesimple/types";

import { youtubeEmbedUrl } from "@eesimple/types";

import { BookmarkDetailBody } from "./BookmarkDetailBody";
import { DetailHeaderActions } from "./DetailHeaderActions";
import { useUiStore } from "../stores/uiStore";

const IMAGE_SIZE_CLASS: Record<BookmarkDetailImageSize, string> = {
  small: "max-h-40 w-full rounded-md border object-contain @2xl:w-40 @2xl:shrink-0",
  medium: "max-h-72 w-full rounded-md border object-contain @2xl:w-72 @2xl:shrink-0",
  large: "max-h-96 w-full rounded-md border object-contain @2xl:w-96 @2xl:shrink-0",
};

const VIDEO_SIZE_CLASS: Record<BookmarkDetailVideoSize, string> = {
  standard: "aspect-video w-full overflow-hidden rounded-md border @2xl:w-96 @2xl:shrink-0",
  half: "aspect-video w-full overflow-hidden rounded-md border @2xl:w-1/2",
  twoThirds: "aspect-video w-full overflow-hidden rounded-md border @2xl:w-2/3",
  fullwidth: "aspect-video w-full overflow-hidden rounded-md border",
};

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
 */
export function BookmarkDetail({
  bookmark, categories = [], properties = [], propertyGroups = [], onEdit, onDelete, onSaveBoolean,
}: BookmarkDetailProps) {
  const imageSize = useUiStore(state => state.bookmarkDetailImageSize);
  const videoSize = useUiStore(state => state.bookmarkDetailVideoSize);

  // For YouTube bookmarks, show a playable embed in place of the static thumbnail.
  const embedUrl = youtubeEmbedUrl(bookmark.url);

  // Only the constrained "standard" size sits side-by-side with the body; the proportional
  // (half/two-thirds) and full-width sizes stay stacked above it.
  const outerFlexClass = embedUrl && videoSize !== "standard"
    ? "flex flex-col gap-6"
    : "flex flex-col gap-6 @2xl:flex-row @2xl:items-start";

  return (
    <div className="@container space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-bold">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              className="
                text-primary
                hover:underline
              "
            >
              {bookmark.title}
            </a>
          </h1>
          <a
            href={bookmark.url}
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
        <DetailHeaderActions
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      <div className={outerFlexClass}>
        {embedUrl
          ? (
            <div className={VIDEO_SIZE_CLASS[videoSize]}>
              <iframe
                src={embedUrl}
                title={bookmark.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="size-full"
              />
            </div>
          )
          : bookmark.image
            ? (
              <img
                src={bookmark.image.url}
                alt=""
                loading="lazy"
                className={IMAGE_SIZE_CLASS[imageSize]}
              />
            )
            : null}

        <BookmarkDetailBody
          bookmark={bookmark}
          categories={categories}
          properties={properties}
          propertyGroups={propertyGroups}
          onSaveBoolean={onSaveBoolean}
        />
      </div>
    </div>
  );
}
