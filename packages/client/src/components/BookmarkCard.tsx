import type { Bookmark, BookmarkTag, CustomProperty } from "@eesimple/types";

import { useCallback, useEffect, useRef, useState } from "react";

import { Link } from "@tanstack/react-router";
import { ExternalLink, MoreVertical, Sparkles } from "lucide-react";

import { useAutoBookmarkImage } from "../hooks/useBookmarks";
import { formatNumber } from "../lib/bookmarkFormat";
import { useUiStore } from "../stores/uiStore";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BookmarkCardProps {
  bookmark: Bookmark;
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties?: CustomProperty[];
  onDelete?: (id: string) => void;
  /**
   * Place the image to the left of the rest of the card (single-column listings) instead of stacked
   * above it (multi-column listings). Defaults to the stacked, image-on-top layout.
   */
  imageLeft?: boolean;
}

/**
 * Image classes for the listing card. The aspect-ratio setting constrains a single dimension and lets
 * the other be `auto` (true ratio, never cropped); the uniform setting keeps the capped `object-cover`
 * crop. Each branch is a literal string so Tailwind v4 emits every utility it sees here.
 */
function bookmarkImageClass(imageLeft: boolean, maintainAspectRatio: boolean): string {
  if (imageLeft) {
    return maintainAspectRatio
      ? "h-auto w-32 shrink-0 self-start rounded-md border sm:w-40"
      : "h-24 w-32 shrink-0 self-start rounded-md border object-cover sm:h-28 sm:w-40";
  }
  return maintainAspectRatio
    ? "mb-2 h-auto w-full rounded-md border"
    : "mb-2 max-h-40 w-full rounded-md border object-cover";
}

interface TagsBoxProps {
  tags: BookmarkTag[];
}

function TagsBox({
  tags,
}: TagsBoxProps) {
  const ref = useRef<HTMLUListElement>(null);
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setShowTop(el.scrollTop > 0);
    setShowBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }, []);

  useEffect(() => {
    sync();
  }, [tags.length, sync]);

  return (
    <div className="relative mt-2">
      <ul
        ref={ref}
        onScroll={sync}
        className="
          flex max-h-20 flex-wrap gap-1 overflow-y-auto rounded-md border p-1
        "
      >
        {tags.map(tag => (
          <li key={tag.id}>
            <Badge variant="secondary">{tag.name}</Badge>
          </li>
        ))}
      </ul>
      {showTop
        ? (
          <div
            className="
              pointer-events-none absolute inset-x-0 top-0 h-5 rounded-t-md
              bg-linear-to-b from-card to-transparent
            "
          />
        )
        : null}
      {showBottom
        ? (
          <div
            className="
              pointer-events-none absolute inset-x-0 bottom-0 h-5 rounded-b-md
              bg-linear-to-t from-card to-transparent
            "
          />
        )
        : null}
    </div>
  );
}

export function BookmarkCard({
  bookmark, properties = [], onDelete, imageLeft = false,
}: BookmarkCardProps) {
  const maintainImageAspectRatio = useUiStore(state => state.maintainImageAspectRatio);
  const autoImage = useAutoBookmarkImage();
  const byId = new Map(properties.map(property => [property.id, property]));

  const numberBadges = bookmark.numberValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property && property.showInListings
        ? {
          id: entry.propertyId,
          label: `${property.name}: ${formatNumber(entry.value, property)}`,
        }
        : null;
    })
    .filter((badge): badge is { id: string;
      label: string; } => badge !== null);

  const booleanBadges = bookmark.booleanValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property && property.showInListings
        ? {
          id: entry.propertyId,
          label: `${property.name}: ${entry.value ? "Yes" : "No"}`,
        }
        : null;
    })
    .filter((badge): badge is { id: string;
      label: string; } => badge !== null);

  const valueBadges = [...numberBadges, ...booleanBadges];

  const header = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="font-semibold">
          <Link
            to="/bookmarks/$bookmarkId"
            params={{
              bookmarkId: bookmark.id,
            }}
            className="
              wrap-break-word text-primary
              hover:underline
            "
          >
            {bookmark.title}
          </Link>
        </h3>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          asChild
        >
          <a
            href={bookmark.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open URL in new tab"
          >
            <ExternalLink className="size-4" />
          </a>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="More options"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                to="/bookmarks/$bookmarkId/edit"
                params={{
                  bookmarkId: bookmark.id,
                }}
              >
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={autoImage.isPending}
              onClick={() => autoImage.mutate(bookmark.id)}
            >
              <Sparkles className="mr-2 size-4" />
              Get page image
            </DropdownMenuItem>
            {onDelete
              ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="
                      text-destructive
                      focus:text-destructive
                    "
                    onClick={() => onDelete(bookmark.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              )
              : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const imageEl = bookmark.image
    ? (
      <img
        src={bookmark.image.url}
        alt=""
        loading="lazy"
        width={bookmark.image.width}
        height={bookmark.image.height}
        className={bookmarkImageClass(imageLeft, maintainImageAspectRatio)}
      />
    )
    : null;

  const details = (
    <>
      {bookmark.description ? <p className="mt-2 text-sm text-foreground">{bookmark.description}</p> : null}
      {bookmark.website
        ? (
          <div className="mt-2">
            <Link
              to="/taxonomies/websites/$websiteSlug"
              params={{
                websiteSlug: bookmark.website.slug,
              }}
            >
              <Badge variant="secondary">{bookmark.website.siteName}</Badge>
            </Link>
          </div>
        )
        : null}
      {bookmark.tags.length > 0 ? <TagsBox tags={bookmark.tags} /> : null}
      {valueBadges.length > 0
        ? (
          <ul className="mt-2 flex flex-wrap gap-1">
            {valueBadges.map(badge => (
              <li key={badge.id}>
                <Badge variant="outline">{badge.label}</Badge>
              </li>
            ))}
          </ul>
        )
        : null}
    </>
  );

  if (imageLeft) {
    return (
      <div className="flex gap-4">
        {imageEl}
        <div className="min-w-0 flex-1">
          {header}
          {details}
        </div>
      </div>
    );
  }

  return (
    <div>
      {imageEl}
      {header}
      {details}
    </div>
  );
}
