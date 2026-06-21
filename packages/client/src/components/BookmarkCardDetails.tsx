import type { BookmarkValueItem, ResolvedFieldPlacement } from "../lib/bookmarkCardValues";
import type { Bookmark, CardFieldZone, Category, CustomProperty } from "@eesimple/types";
import type { ReactNode } from "react";

import { useEffect, useRef, useState } from "react";

import { CARD_BODY_ZONES } from "@eesimple/types";

import { BookmarkTagsBox } from "./BookmarkTagsBox";
import { CategoryPill } from "./CategoryPill";
import { MediaTypePill } from "./MediaTypePill";
import { SourcePill } from "./SourcePill";
import { StarRating } from "./StarRating";
import { useHideWebsiteForYouTube } from "../lib/bookmarkCardFields";
import { buildBookmarkValueItems } from "../lib/bookmarkCardValues";

import { Badge } from "@/components/ui/badge";

interface BookmarkCardDetailsProps {
  bookmark: Bookmark;
  properties: CustomProperty[];
  /** Resolved field placements; a field is shown in the body when its placement's corner is `null`. */
  placements: Map<string, ResolvedFieldPlacement>;
  /** The bookmark's resolved (non-built-in) category, used for the category pill. */
  bookmarkCategory?: Category;
  /** Resolved "hide website pill for YouTube" value; when omitted, the Default card display rule applies. */
  hideWebsiteForYouTube?: boolean;
  /** Persist a rating-scale value edited inline on the card (only wired when the property is `editableOnCard`). */
  onSaveRating?: (propertyId: string, value: number) => void;
  /** Toggle a boolean value from the card (only wired for properties with `clickableInView`). */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
}

/** The three render forms a card-body sub-zone imposes on the fields placed in it. */
type FieldForm = "single" | "label" | "table";

function zoneForm(zone: CardFieldZone): FieldForm {
  if (zone === "card-labels") return "label";
  if (zone === "card-table") return "table";
  return "single";
}

/**
 * How one field can render in the card body. `inline` is its compact pill/badge form (the `label`
 * zone); `block` is its full-width form (the `single` zones); `tableName`/`tableValue` are the two
 * columns of the `table` zone. A form left `null` falls back to the other one.
 */
interface FieldRender {
  inline: ReactNode;
  block: ReactNode;
  tableName: string;
  tableValue: ReactNode;
}

/**
 * The body of a bookmark card. Fields render in the four card-body sub-zones (single-top → labels →
 * table → single-bottom, in that fixed order), each field in the form its zone imposes and in the
 * order it sits within the zone (so the rule's field ordering is honored).
 */
export function BookmarkCardDetails({
  bookmark, properties, placements, bookmarkCategory, hideWebsiteForYouTube,
  onSaveRating, onSaveBoolean,
}: BookmarkCardDetailsProps) {
  // Listings pass the rule-resolved value explicitly; other surfaces fall back to the Default rule.
  const defaultHideWebsiteForYouTube = useHideWebsiteForYouTube();
  const effectiveHideWebsiteForYouTube = hideWebsiteForYouTube ?? defaultHideWebsiteForYouTube;

  // Single source of truth for value placement; corner-placed values (overlaid on the image) are
  // excluded here so a value isn't also shown as a badge.
  const valueItems = buildBookmarkValueItems(bookmark, properties, placements)
    .filter(item => item.corner === null);
  const valueById = new Map(valueItems.map(item => [item.id, item]));

  const {
    website, mediaType, youtubeChannel,
  } = bookmark;

  // Description fade: only fade when the 4-line box actually clips the text. Re-measure on width
  // changes (column count / viewport alter wrapping), mirroring BookmarkTagsBox.
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [descriptionOverflows, setDescriptionOverflows] = useState(false);
  const descriptionPlacement = placements.get("description");
  const showDescription = !!bookmark.description && descriptionPlacement?.corner === null;

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    const sync = () => setDescriptionOverflows(el.scrollHeight > el.clientHeight + 1);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [bookmark.description, showDescription]);

  const descriptionNode = (
    <div
      ref={descriptionRef}
      className="relative max-h-24 overflow-hidden"
    >
      <p className="text-sm/6 text-foreground">{bookmark.description}</p>
      {descriptionOverflows
        ? (
          <div
            className="
              pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t
              from-card to-transparent
            "
          />
        )
        : null}
    </div>
  );

  /** Render a custom-property value badge, wiring an inline toggle for clickable booleans. */
  function badgeNode(item: Extract<BookmarkValueItem, { kind: "badge" }>, text: ReactNode): ReactNode {
    const onToggle = onSaveBoolean && item.property.clickableInView && item.booleanValue !== undefined
      ? () => onSaveBoolean(item.id, !item.booleanValue)
      : undefined;
    if (!onToggle) return <Badge variant="outline">{text}</Badge>;
    return (
      <button
        type="button"
        title="Click to toggle"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }}
      >
        <Badge
          variant="outline"
          className="
            cursor-pointer
            hover:bg-accent
          "
        >
          {text}
        </Badge>
      </button>
    );
  }

  /** A rating's stars, editable when the property opted in and a save handler is wired. */
  function ratingStars(item: Extract<BookmarkValueItem, { kind: "rating" }>, withLabel: boolean): ReactNode {
    const editable = item.property.editableOnCard && onSaveRating !== undefined;
    return (
      <StarRating
        value={item.value}
        max={item.property.ratingMax ?? 5}
        allowHalf={item.property.ratingAllowHalf}
        allowZero={item.property.ratingAllowZero}
        readOnly={!editable}
        onChange={editable ? next => onSaveRating(item.property.id, next) : undefined}
        label={withLabel && item.property.ratingShowLabel ? (item.property.ratingLabel ?? undefined) : undefined}
        size={16}
      />
    );
  }

  /** The render forms for one placed field key, or `null` when it has nothing to show. */
  function describeField(key: string): FieldRender | null {
    switch (key) {
      case "description": {
        if (!bookmark.description) return null;
        // No inline pill form — falls back to a full-width paragraph in the Labels zone.
        return {
          inline: null,
          block: descriptionNode,
          tableName: "Description",
          tableValue: <span className="text-sm">{bookmark.description}</span>,
        };
      }
      case "category": {
        if (!bookmarkCategory) return null;
        const pill = <CategoryPill category={bookmarkCategory} />;
        return {
          inline: pill,
          block: pill,
          tableName: "Category",
          tableValue: <span className="text-sm">{bookmarkCategory.name}</span>,
        };
      }
      case "website": {
        if (!website || (youtubeChannel && effectiveHideWebsiteForYouTube)) return null;
        const pill = (
          <SourcePill
            type="website"
            data={website}
          />
        );
        return {
          inline: pill,
          block: pill,
          tableName: "Website",
          tableValue: <span className="text-sm">{website.siteName}</span>,
        };
      }
      case "mediaType": {
        if (!mediaType) return null;
        const pill = <MediaTypePill mediaType={mediaType} />;
        return {
          inline: pill,
          block: pill,
          tableName: "Media Type",
          tableValue: <span className="text-sm">{mediaType.name}</span>,
        };
      }
      case "youtubeChannel": {
        if (!youtubeChannel) return null;
        const pill = (
          <SourcePill
            type="youtube-channel"
            data={youtubeChannel}
          />
        );
        return {
          inline: pill,
          block: pill,
          tableName: "YouTube Channel",
          tableValue: <span className="text-sm">{youtubeChannel.name}</span>,
        };
      }
      case "tags": {
        if (bookmark.tags.length === 0) return null;
        const box = <BookmarkTagsBox tags={bookmark.tags} />;
        // The tags box is block-level — full-width in the Labels zone too.
        return {
          inline: null,
          block: box,
          tableName: "Tags",
          tableValue: <span className="text-sm">{bookmark.tags.map(tag => tag.name).join(", ")}</span>,
        };
      }
      default: {
        const item = valueById.get(key);
        if (!item) return null;
        if (item.kind === "rating") {
          const labeled = (
            <span
              className="
                flex flex-wrap items-center gap-2 text-sm text-muted-foreground
              "
            >
              <span>{item.property.name}</span>
              {ratingStars(item, true)}
            </span>
          );
          return {
            inline: labeled,
            block: labeled,
            tableName: item.property.name,
            tableValue: ratingStars(item, false),
          };
        }
        // Image values can show their thumbnail; other badges show their formatted value.
        const thumb = item.imageUrl
          ? (
            <img
              src={item.imageUrl}
              alt=""
              className="h-8 w-auto rounded-sm object-cover"
            />
          )
          : null;
        return {
          inline: badgeNode(item, item.label),
          block: badgeNode(item, item.label),
          tableName: item.name,
          tableValue: thumb ?? <span className="text-sm">{item.value}</span>,
        };
      }
    }
  }

  // Group the body-placed keys by their sub-zone, preserving each zone's field order (placements is
  // built in zone-then-array order, so Map insertion order matches).
  const keysByZone = new Map<CardFieldZone, string[]>();
  for (const [key, placement] of placements) {
    if (placement.corner !== null) continue;
    const list = keysByZone.get(placement.zone) ?? [];
    list.push(key);
    keysByZone.set(placement.zone, list);
  }

  function renderZone(zone: CardFieldZone): ReactNode {
    const keys = keysByZone.get(zone) ?? [];
    const entries = keys
      .map(key => ({
        key,
        render: describeField(key),
        hideLabel: placements.get(key)?.hideLabel ?? false,
      }))
      .filter((entry): entry is { key: string;
        render: FieldRender;
        hideLabel: boolean; } => entry.render !== null);
    if (entries.length === 0) return null;

    const form = zoneForm(zone);
    if (form === "table") {
      return (
        <dl
          key={zone}
          className="
            mt-2 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1
          "
        >
          {entries.map(entry => (
            entry.hideLabel
              ? (
                <dd
                  key={entry.key}
                  className="col-span-2 min-w-0"
                >
                  {entry.render.tableValue}
                </dd>
              )
              : (
                <div
                  key={entry.key}
                  className="contents"
                >
                  <dt className="text-sm font-medium text-muted-foreground">{entry.render.tableName}</dt>
                  <dd className="min-w-0">{entry.render.tableValue}</dd>
                </div>
              )
          ))}
        </dl>
      );
    }

    if (form === "label") {
      // Inline pills/badges flow in a wrap row; block-only fields (description, tags) take a full row.
      return (
        <div
          key={zone}
          className="mt-2 flex flex-wrap items-center gap-1"
        >
          {entries.map(entry => (
            entry.render.inline
              ? <span key={entry.key}>{entry.render.inline}</span>
              : (
                <div
                  key={entry.key}
                  className="w-full"
                >
                  {entry.render.block}
                </div>
              )
          ))}
        </div>
      );
    }

    // single-top / single-bottom: every field is a full-width stacked row.
    return (
      <div
        key={zone}
        className="mt-2 space-y-2"
      >
        {entries.map(entry => (
          <div key={entry.key}>{entry.render.block ?? entry.render.inline}</div>
        ))}
      </div>
    );
  }

  return <>{CARD_BODY_ZONES.map(zone => renderZone(zone))}</>;
}
