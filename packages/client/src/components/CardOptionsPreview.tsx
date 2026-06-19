import type { Bookmark } from "@eesimple/types";

import { ExternalLink } from "lucide-react";

import { BookmarkCardDetails } from "./BookmarkCardDetails";
import { useCategories } from "../hooks/useCategories";
import { useUiStore } from "../stores/uiStore";

const PREVIEW_CREATED_AT = "2026-01-15T12:00:00.000Z";

/** Non-interactive dummy bookmark card shown in the Card Options popover so users can preview field visibility changes live. */
export function CardOptionsPreview({ pageKey }: { pageKey: string }) {
  const { data: allCategories = [] } = useCategories();
  const dummyCategory = allCategories.find(c => !c.builtIn);

  const filterProperties = useUiStore(state => state.filterContext?.properties ?? []);
  const visibleProperties = filterProperties.filter(
    p => p.showInListings && p.type !== "calculate",
  );

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

  return (
    <div
      aria-hidden="true"
      inert
      className="w-44 shrink-0"
    >
      <div className="rounded-md border bg-card p-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium">Example Bookmark</span>
          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
        </div>
        <BookmarkCardDetails
          bookmark={dummyBookmark}
          properties={visibleProperties}
          pageKey={pageKey}
        />
      </div>
    </div>
  );
}
