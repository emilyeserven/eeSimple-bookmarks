import type { Bookmark, CustomProperty } from "@eesimple/types";

import { useRef } from "react";

import { ExternalLink, ImageIcon } from "lucide-react";

import { BookmarkCardDetails } from "./BookmarkCardDetails";
import { useCategories } from "../hooks/useCategories";
import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { useElementHeight, useObservedWidth } from "../hooks/useObservedWidth";
import {
  useBookmarkColumns,
  useBookmarkImageLayout,
  useBookmarkImageMode,
  useBookmarkImageVisibility,
} from "../lib/bookmarkColumns";
import { bookmarkImageAspectStyle, bookmarkImageClass } from "../lib/bookmarkImage";
import { useUiStore } from "../stores/uiStore";

/**
 * Stable empty default so the zustand selector never returns a fresh array. A new `[]` each call
 * makes `useSyncExternalStore` loop ("Maximum update depth exceeded").
 */
const EMPTY_PROPERTIES: CustomProperty[] = [];

const PREVIEW_CREATED_AT = "2026-01-15T12:00:00.000Z";

/** Width the preview is scaled down to so it fits beside the field toggles in the popover. */
const PREVIEW_TARGET_WIDTH = 192;

/** Width to render at when no real card is on the page to measure (e.g. an empty listing). */
const FALLBACK_CARD_WIDTH = 192;

/** Non-interactive dummy bookmark card shown in the Card Options popover so users can preview field visibility changes live. */
export function CardOptionsPreview({
  pageKey,
}: { pageKey: string }) {
  const {
    data: allCategories = [],
  } = useCategories();
  const dummyCategory = allCategories.find(c => !c.builtIn);

  const filterProperties = useUiStore(state => state.filterContext?.properties) ?? EMPTY_PROPERTIES;
  const visibleProperties = filterProperties.filter(
    p => p.showInListings && p.type !== "calculate",
  );

  // Mirror the listing page's real layout settings so the preview matches what cards look like.
  const imageMode = useBookmarkImageMode(pageKey);
  const imageVisibility = useBookmarkImageVisibility(pageKey);
  const columns = useBookmarkColumns(pageKey);
  const imageLayout = useBookmarkImageLayout(pageKey);
  const imageLeft = (columns === 1 || columns === 2) && imageLayout === "side";
  const croppedWidth = useUiStore(state => state.croppedWidth);
  const croppedHeight = useUiStore(state => state.croppedHeight);
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();

  // Measure a real card currently on the page, then scale the preview down to fit the popover. A
  // uniform CSS scale keeps the image-to-text size ratio identical to the real card.
  const realWidth = useObservedWidth("[data-bookmark-card-sample]");
  const cardWidth = realWidth ?? FALLBACK_CARD_WIDTH;
  const scale = Math.min(1, PREVIEW_TARGET_WIDTH / cardWidth);
  const cardRef = useRef<HTMLDivElement>(null);
  const naturalHeight = useElementHeight(cardRef);

  const dummyBookmark: Bookmark = {
    id: "__card-preview__",
    url: "#",
    originalUrl: null,
    title: "Example Bookmark",
    description: "A sample description showing how card fields appear.",
    image: null,
    imageAutoGrabError: null,
    categoryId: dummyCategory?.id ?? "__none__",
    website: {
      id: "__site__",
      domain: "example.com",
      siteName: "Example Site",
      slug: "example-site",
      imageUrl: null,
    },
    mediaType: {
      id: "__media__",
      name: "Article",
      slug: "article",
      icon: null,
      parentId: null,
    },
    youtubeChannel: {
      id: "__channel__",
      name: "Example Channel",
      slug: "example-channel",
      imageUrl: null,
    },
    tags: [
      {
        id: "__tag1__",
        name: "example",
        slug: "example",
        parentId: null,
      },
      {
        id: "__tag2__",
        name: "preview",
        slug: "preview",
        parentId: null,
      },
    ],
    numberValues: visibleProperties
      .filter(p => p.type === "number")
      .map(p => ({
        propertyId: p.id,
        value: 42,
      })),
    booleanValues: visibleProperties
      .filter(p => p.type === "boolean")
      .map(p => ({
        propertyId: p.id,
        value: true,
      })),
    dateTimeValues: visibleProperties
      .filter(p => p.type === "datetime")
      .map(p => ({
        propertyId: p.id,
        value: PREVIEW_CREATED_AT,
      })),
    relatedBookmarks: [],
    priority: 0,
    createdAt: PREVIEW_CREATED_AT,
  };

  // Placeholder stand-in for the bookmark image, sized exactly like the real card's <img>. Real
  // images in "natural" mode set their own height; with no image to size it, give the placeholder a
  // default aspect so it reads as an image area rather than collapsing to the icon's height.
  const imageEl = imageVisibility !== "off"
    ? (
      <div
        className={`
          flex items-center justify-center bg-muted
          ${bookmarkImageClass(imageLeft, imageMode)}
          ${imageMode === "natural" ? "aspect-16/10" : ""}
        `}
        style={bookmarkImageAspectStyle(imageMode, croppedWidth, croppedHeight, customRatios)}
      >
        <ImageIcon className="size-6 text-muted-foreground" />
      </div>
    )
    : null;

  const header = (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate font-medium">Example Bookmark</span>
      <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
    </div>
  );

  const details = (
    <BookmarkCardDetails
      bookmark={dummyBookmark}
      properties={visibleProperties}
      pageKey={pageKey}
    />
  );

  let body;
  if (imageVisibility === "image-only" && imageEl) {
    body = imageEl;
  }
  else if (imageLeft) {
    body = (
      <div className="flex gap-4">
        {imageEl}
        <div className="min-w-0 flex-1">
          {header}
          {details}
        </div>
      </div>
    );
  }
  else {
    body = (
      <>
        {imageEl}
        {header}
        {details}
      </>
    );
  }

  return (
    <div
      aria-hidden="true"
      inert
      className="shrink-0 overflow-hidden"
      style={{
        width: cardWidth * scale,
        height: naturalHeight != null ? naturalHeight * scale : undefined,
      }}
    >
      <div
        ref={cardRef}
        className="rounded-lg border bg-card p-4 text-sm"
        style={{
          width: cardWidth,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {body}
      </div>
    </div>
  );
}
