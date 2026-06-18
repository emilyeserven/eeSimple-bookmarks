import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  BookmarkTag,
  CustomProperty,
} from "@eesimple/types";

import { useCallback, useEffect, useRef, useState } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { ExternalLink, MoreVertical, Sparkles } from "lucide-react";

import { DateTimePicker } from "./DateTimePicker";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { useAutoBookmarkImage, useUpdateBookmark } from "../hooks/useBookmarks";
import { formatDateTime, formatNumber } from "../lib/bookmarkFormat";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

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
  /** When true, images keep their natural aspect ratio; when false they're cropped to a uniform capped size. Defaults to true. */
  maintainImageAspectRatio?: boolean;
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

/** Replace the entry for `propertyId` with `value`, or append it when the property has no value yet. */
function mergeNumberValue(
  values: BookmarkNumberValue[],
  propertyId: string,
  value: number,
): BookmarkNumberValue[] {
  return values.some(entry => entry.propertyId === propertyId)
    ? values.map(entry => (entry.propertyId === propertyId
      ? {
        propertyId,
        value,
      }
      : entry))
    : [...values, {
      propertyId,
      value,
    }];
}

/** Replace the entry for `propertyId` with `value`, or append it when the property has no value yet. */
function mergeBooleanValue(
  values: BookmarkBooleanValue[],
  propertyId: string,
  value: boolean,
): BookmarkBooleanValue[] {
  return values.some(entry => entry.propertyId === propertyId)
    ? values.map(entry => (entry.propertyId === propertyId
      ? {
        propertyId,
        value,
      }
      : entry))
    : [...values, {
      propertyId,
      value,
    }];
}

/** Replace the entry for `propertyId` with `value`, or append it when the property has no value yet. */
function mergeDateTimeValue(
  values: BookmarkDateTimeValue[],
  propertyId: string,
  value: string,
): BookmarkDateTimeValue[] {
  return values.some(entry => entry.propertyId === propertyId)
    ? values.map(entry => (entry.propertyId === propertyId
      ? {
        propertyId,
        value,
      }
      : entry))
    : [...values, {
      propertyId,
      value,
    }];
}

interface CardNumberPropertyEditorProps {
  property: CustomProperty;
  inputId: string;
  /** The bookmark's current value for this property, or `undefined` when unset. */
  current: number | undefined;
  /** Commit a new numeric value (called on blur / Enter, only when it changed). */
  onCommit: (value: number) => void;
}

/** A labelled number input rendered inside the card's "More" menu (keystrokes stay out of the menu). */
function CardNumberPropertyEditor({
  property, inputId, current, onCommit,
}: CardNumberPropertyEditorProps) {
  const [draft, setDraft] = useState(current === undefined ? "" : String(current));

  // Re-seed when the saved value changes (e.g. after a successful save or external update).
  useEffect(() => {
    setDraft(current === undefined ? "" : String(current));
  }, [current]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed === "") return;
    const next = Number(trimmed);
    if (Number.isNaN(next) || next === current) return;
    onCommit(next);
  }

  return (
    <div className="px-2 py-1.5">
      <Label
        htmlFor={inputId}
        className="text-xs text-muted-foreground"
      >
        {property.name}
        {property.unitPlural ? ` (${property.unitPlural})` : ""}
      </Label>
      <Input
        id={inputId}
        type="number"
        className="mt-1 h-8"
        value={draft}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        // Keep typing (digits, space, arrows) from reaching the menu's typeahead/navigation.
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
      />
    </div>
  );
}

export function BookmarkCard({
  bookmark, properties = [], onDelete, imageLeft = false, maintainImageAspectRatio = true,
}: BookmarkCardProps) {
  const autoImage = useAutoBookmarkImage();
  const updateBookmark = useUpdateBookmark();
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const byId = new Map(properties.map(property => [property.id, property]));

  // Properties opted into inline editing from this card, limited to ones that apply to its category.
  // Calculate properties are computed server-side, so they are never editable here.
  const editableProperties = properties.filter(property =>
    property.editableOnCard
    && property.type !== "calculate"
    && propertyAppliesToCategory(property, bookmark.categoryId));

  function saveNumber(propertyId: string, value: number) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        numberValues: mergeNumberValue(bookmark.numberValues, propertyId, value),
      },
    });
  }

  function saveBoolean(propertyId: string, value: boolean) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        booleanValues: mergeBooleanValue(bookmark.booleanValues, propertyId, value),
      },
    });
  }

  function saveDateTime(propertyId: string, value: string) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        dateTimeValues: mergeDateTimeValue(bookmark.dateTimeValues, propertyId, value),
      },
    });
  }

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

  const dateTimeBadges = bookmark.dateTimeValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property && property.showInListings
        ? {
          id: entry.propertyId,
          label: `${property.name}: ${formatDateTime(entry.value, property)}`,
        }
        : null;
    })
    .filter((badge): badge is { id: string;
      label: string; } => badge !== null);

  const valueBadges = [...numberBadges, ...booleanBadges, ...dateTimeBadges];

  const header = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="font-semibold">
          <Link
            to="/bookmarks/$bookmarkId"
            params={{
              bookmarkId: bookmark.id,
            }}
            title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => viewClick(event, "bookmark", bookmark.id)}
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
                title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                onClick={event => editClick(event, "bookmark", bookmark.id)}
              >
                Edit
              </Link>
            </DropdownMenuItem>
            {editableProperties.length > 0
              ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Quick edit
                  </DropdownMenuLabel>
                  {editableProperties.map((property) => {
                    if (property.type === "boolean") {
                      const checked
                        = bookmark.booleanValues.find(entry => entry.propertyId === property.id)?.value
                          ?? false;
                      return (
                        <DropdownMenuCheckboxItem
                          key={property.id}
                          checked={checked}
                          // Keep the menu open so several values can be edited in one go.
                          onSelect={event => event.preventDefault()}
                          onCheckedChange={value => saveBoolean(property.id, value === true)}
                        >
                          {property.name}
                        </DropdownMenuCheckboxItem>
                      );
                    }
                    if (property.type === "datetime") {
                      const current
                        = bookmark.dateTimeValues.find(entry => entry.propertyId === property.id)?.value
                          ?? null;
                      return (
                        <div
                          key={property.id}
                          className="px-2 py-1.5"
                          // Keep keystrokes/clicks inside the picker from reaching the menu.
                          onKeyDown={event => event.stopPropagation()}
                        >
                          <Label className="text-xs text-muted-foreground">{property.name}</Label>
                          <div className="mt-1">
                            <DateTimePicker
                              format={property.dateTimeFormat ?? "date"}
                              value={current}
                              onChange={value => saveDateTime(property.id, value ?? "")}
                            />
                          </div>
                        </div>
                      );
                    }
                    return (
                      <CardNumberPropertyEditor
                        key={property.id}
                        property={property}
                        inputId={`card-${bookmark.id}-property-${property.id}`}
                        current={
                          bookmark.numberValues.find(entry => entry.propertyId === property.id)?.value
                        }
                        onCommit={value => saveNumber(property.id, value)}
                      />
                    );
                  })}
                </>
              )
              : null}
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

  const {
    website, mediaType, youtubeChannel,
  } = bookmark;
  const details = (
    <>
      {bookmark.description
        ? (
          <div className="relative mt-2 max-h-18 overflow-hidden">
            <p className="text-sm/6 text-foreground">{bookmark.description}</p>
            <div
              className="
                pointer-events-none absolute inset-x-0 bottom-0 h-8
                bg-linear-to-t from-card to-transparent
              "
            />
          </div>
        )
        : null}
      {website || mediaType || youtubeChannel
        ? (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {website
              ? (
                <Link
                  to="/taxonomies/websites/$websiteSlug"
                  params={{
                    websiteSlug: website.slug,
                  }}
                  title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                  onClick={event => viewClick(event, "website", website.id)}
                >
                  <Badge variant="secondary">{website.siteName}</Badge>
                </Link>
              )
              : null}
            {mediaType
              ? (
                <Link
                  to="/taxonomies/media-types/$mediaTypeSlug"
                  params={{
                    mediaTypeSlug: mediaType.slug,
                  }}
                  title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                  onClick={event => viewClick(event, "media-type", mediaType.id)}
                >
                  <Badge variant="secondary">{mediaType.name}</Badge>
                </Link>
              )
              : null}
            {youtubeChannel
              ? (
                <Link
                  to="/taxonomies/youtube-channels/$channelSlug"
                  params={{
                    channelSlug: youtubeChannel.slug,
                  }}
                  title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                  onClick={event => viewClick(event, "youtube-channel", youtubeChannel.id)}
                >
                  <Badge variant="secondary">{youtubeChannel.name}</Badge>
                </Link>
              )
              : null}
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
