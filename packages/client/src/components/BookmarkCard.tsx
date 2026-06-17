import type { Bookmark, BookmarkTag, CustomProperty } from "@eesimple/types";

import { useCallback, useEffect, useRef, useState } from "react";

import { Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";

import { formatNumber } from "../lib/bookmarkFormat";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BookmarkCardProps {
  bookmark: Bookmark;
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties?: CustomProperty[];
  onDelete?: (id: string) => void;
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
  bookmark, properties = [], onDelete,
}: BookmarkCardProps) {
  const byId = new Map(properties.map(property => [property.id, property]));

  const numberBadges = bookmark.numberValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property
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
      return property
        ? {
          id: entry.propertyId,
          label: `${property.name}: ${entry.value ? "Yes" : "No"}`,
        }
        : null;
    })
    .filter((badge): badge is { id: string;
      label: string; } => badge !== null);

  const valueBadges = [...numberBadges, ...booleanBadges];

  return (
    <div>
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
          {bookmark.website
            ? (
              <div className="mt-1">
                <Badge
                  variant="secondary"
                  className="gap-1"
                >
                  <Globe className="size-3" />
                  {bookmark.website.siteName}
                </Badge>
              </div>
            )
            : null}
        </div>
        {onDelete
          ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(bookmark.id)}
                className="
                  text-destructive
                  hover:text-destructive
                "
              >
                Delete
              </Button>
            </div>
          )
          : null}
      </div>
      {bookmark.description ? <p className="mt-2 text-sm text-foreground">{bookmark.description}</p> : null}
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
    </div>
  );
}
