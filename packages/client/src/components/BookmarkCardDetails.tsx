import type { BookmarkValueItem, ResolvedFieldPlacement } from "../lib/bookmarkCardValues";
import type { Bookmark, CardFieldZone, CardZoneLayout, CardZoneLayouts, Category, CustomProperty } from "@eesimple/types";
import type { ReactNode } from "react";

import { useEffect, useRef, useState } from "react";

import { CARD_BODY_ZONES } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { ExternalLink, MoreVertical } from "lucide-react";

import { BookmarkCardMenu } from "./BookmarkCardMenu";
import { BookmarkTagsBox } from "./BookmarkTagsBox";
import { CategoryPill } from "./CategoryPill";
import { MediaTypePill } from "./MediaTypePill";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { SourcePill } from "./SourcePill";
import { StarRating } from "./StarRating";
import { useHideWebsiteForYouTube } from "../lib/bookmarkCardFields";
import { buildBookmarkValueItems } from "../lib/bookmarkCardValues";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** The card header field keys, rendered as a justified header row when co-located in a single zone. */
const HEADER_FIELD_KEYS = new Set(["title", "externalLink", "more"]);

/** No-op fallback for the optional "More" menu handlers when this surface doesn't wire them. */
const noop = (): void => undefined;

interface BookmarkCardDetailsProps {
  bookmark: Bookmark;
  properties: CustomProperty[];
  /** Resolved field placements; a field is shown in the body when its placement's corner is `null`. */
  placements: Map<string, ResolvedFieldPlacement>;
  /** Resolved per-body-zone layout (flex vs grid); when omitted each zone uses its default arrangement. */
  cardZoneLayouts?: CardZoneLayouts;
  /** The bookmark's resolved (non-built-in) category, used for the category pill. */
  bookmarkCategory?: Category;
  /** Resolved "hide website pill for YouTube" value; when omitted, the Default card display rule applies. */
  hideWebsiteForYouTube?: boolean;
  /** Properties editable from the "More" menu (passed through to {@link BookmarkCardMenu}). */
  editableProperties?: CustomProperty[];
  /** Whether an auto-image capture is in flight (for the "More" menu). */
  autoImagePending?: boolean;
  /** Trigger an auto-image capture from the "More" menu. */
  onAutoImage?: () => void;
  /** Persist a number value edited from the "More" menu. */
  onSaveNumber?: (propertyId: string, value: number) => void;
  /** Persist a datetime value edited from the "More" menu. */
  onSaveDateTime?: (propertyId: string, value: string) => void;
  /** Delete handler wired into the "More" menu. */
  onDelete?: (id: string) => void;
  /** Persist a rating-scale value edited inline on the card (only wired when the property is `editableOnCard`). */
  onSaveRating?: (propertyId: string, value: number) => void;
  /** Toggle a boolean value from the card (only wired for placements with `clickableInView`). */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
}

/** The three render forms a card-body sub-zone imposes on the fields placed in it. */
type FieldForm = "single" | "label" | "table";

function zoneForm(zone: CardFieldZone): FieldForm {
  if (zone === "card-labels") return "label";
  if (zone === "card-table") return "table";
  return "single";
}

/** The zone's layout, defaulting to its natural arrangement (Table → grid, others → flex) when unset. */
function zoneLayout(zone: CardFieldZone, layouts: CardZoneLayouts | undefined): CardZoneLayout {
  const explicit = layouts?.[zone as keyof CardZoneLayouts];
  if (explicit) return explicit;
  return zone === "card-table" ? "grid" : "flex";
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
  bookmark, properties, placements, cardZoneLayouts, bookmarkCategory, hideWebsiteForYouTube,
  editableProperties = [], autoImagePending = false, onAutoImage,
  onSaveNumber, onSaveDateTime, onDelete,
  onSaveRating, onSaveBoolean,
}: BookmarkCardDetailsProps) {
  // Listings pass the rule-resolved value explicitly; other surfaces fall back to the Default rule.
  const defaultHideWebsiteForYouTube = useHideWebsiteForYouTube();
  const effectiveHideWebsiteForYouTube = hideWebsiteForYouTube ?? defaultHideWebsiteForYouTube;
  const viewClick = useViewPanelClick();
  const sidebarModifier = useUiStore(state => state.sidebarOpenModifier);

  // The card header elements, now placeable fields (title link, open-URL button, "More" menu).
  const titleNode = (
    <h3 className="font-semibold">
      <Link
        to="/bookmarks/$bookmarkId"
        params={{
          bookmarkId: bookmark.id,
        }}
        title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[sidebarModifier]} to open in the sidebar)`}
        onClick={event => viewClick(event, "bookmark", bookmark.id)}
        className="
          wrap-break-word text-primary
          hover:underline
        "
      >
        {bookmark.title}
      </Link>
    </h3>
  );
  const externalLinkNode = (
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
  );
  const moreNode = (
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
      <BookmarkCardMenu
        bookmark={bookmark}
        editableProperties={editableProperties}
        autoImagePending={autoImagePending}
        onAutoImage={onAutoImage ?? noop}
        onSaveNumber={onSaveNumber ?? noop}
        onSaveBoolean={onSaveBoolean ?? noop}
        onSaveDateTime={onSaveDateTime ?? noop}
        onDelete={onDelete}
      />
    </DropdownMenu>
  );

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
    const onToggle = onSaveBoolean && item.clickableInView && item.booleanValue !== undefined
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
      case "title": {
        return {
          inline: titleNode,
          block: titleNode,
          tableName: "Title",
          tableValue: titleNode,
        };
      }
      case "externalLink": {
        return {
          inline: externalLinkNode,
          block: externalLinkNode,
          tableName: "Link",
          tableValue: externalLinkNode,
        };
      }
      case "more": {
        return {
          inline: moreNode,
          block: moreNode,
          tableName: "",
          tableValue: moreNode,
        };
      }
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
    const layout = zoneLayout(zone, cardZoneLayouts);
    if (form === "table") {
      // Grid: the classic two-column `label : value` table. Flex: each pair wraps inline.
      if (layout === "flex") {
        return (
          <div
            key={zone}
            className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1"
          >
            {entries.map(entry => (
              <span
                key={entry.key}
                className="flex min-w-0 items-center gap-1 text-sm"
              >
                {entry.hideLabel
                  ? null
                  : <span className="font-medium text-muted-foreground">{entry.render.tableName}</span>}
                <span className="min-w-0">{entry.render.tableValue}</span>
              </span>
            ))}
          </div>
        );
      }
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
      // Flex: pills/badges flow in a wrap row. Grid: a fixed two-column grid. Block-only fields
      // (description, tags) span the full width in either layout.
      const containerClass = layout === "grid"
        ? "mt-2 grid grid-cols-2 items-center gap-1"
        : "mt-2 flex flex-wrap items-center gap-1";
      const blockClass = layout === "grid" ? "col-span-2" : "w-full";
      return (
        <div
          key={zone}
          className={containerClass}
        >
          {entries.map(entry => (
            entry.render.inline
              ? <span key={entry.key}>{entry.render.inline}</span>
              : (
                <div
                  key={entry.key}
                  className={blockClass}
                >
                  {entry.render.block}
                </div>
              )
          ))}
        </div>
      );
    }

    // single-top / single-bottom: full-width stacked rows. The header fields (title + action buttons),
    // when co-located here, render as a justified header row (title left, buttons right) reproducing the
    // old fixed card header; the remaining fields stack below.
    const titleEntry = entries.find(entry => entry.key === "title");
    const actionEntries = entries.filter(entry => entry.key === "externalLink" || entry.key === "more");
    const restEntries = entries.filter(entry => !HEADER_FIELD_KEYS.has(entry.key));
    const hasHeader = titleEntry !== undefined || actionEntries.length > 0;
    // Grid arranges the non-header rows in two columns; flex stacks them full-width (the default).
    const restClass = layout === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2";
    return (
      <div
        key={zone}
        className="mt-2 space-y-2"
      >
        {hasHeader
          ? (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">{titleEntry?.render.block}</div>
              {actionEntries.length > 0
                ? (
                  <div className="flex shrink-0 items-center gap-1">
                    {actionEntries.map(entry => <span key={entry.key}>{entry.render.inline}</span>)}
                  </div>
                )
                : null}
            </div>
          )
          : null}
        {restEntries.length > 0
          ? (
            <div className={restClass}>
              {restEntries.map(entry => (
                <div key={entry.key}>{entry.render.block ?? entry.render.inline}</div>
              ))}
            </div>
          )
          : null}
      </div>
    );
  }

  return <>{CARD_BODY_ZONES.map(zone => renderZone(zone))}</>;
}
