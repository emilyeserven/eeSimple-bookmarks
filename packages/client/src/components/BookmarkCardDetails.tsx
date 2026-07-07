import type { BookmarkCardMenuControls } from "./BookmarkCardActions";
import type { FieldRender } from "./bookmarkCardTaxonomyFields";
import type { ResolvedFieldPlacement } from "../lib/bookmarkCardValues";
import type { Bookmark, CardFieldZone, CardZoneLayout, CardZoneLayouts, Category, CustomProperty } from "@eesimple/types";
import type { ReactNode } from "react";

import { CARD_BODY_ZONES, normalizeCardZoneLayout } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { BookmarkExternalLinkButton, BookmarkMoreMenu } from "./BookmarkCardActions";
import { badgeNode, ratingStars } from "./bookmarkCardFieldRenders";
import { describeTaxonomyField } from "./bookmarkCardTaxonomyFields";
import { BookmarkSecondaryNameField, BookmarkTitleLink, DescriptionOverflowDiv } from "./BookmarkTitleLink";
import { useBookmarkLinkOutNodes } from "./useBookmarkLinkOutNodes";
import { useHideWebsiteForYouTube } from "../lib/bookmarkCardFields";
import { buildBookmarkValueItems } from "../lib/bookmarkCardValues";
import { cardBodyContainerClass, gapClass, zoneForm } from "../lib/cardZoneLayoutClasses";

/** The card header field keys, rendered as a justified header row when co-located in a single zone. */
const HEADER_FIELD_KEYS = new Set(["title", "externalLink", "more"]);

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
  /**
   * When true, adds top margin to the details wrapper so the content sits below the stacked card image
   * (image `mb-2` + details `mt-2` = 16px gap). When false (no image, or image is to the left), the
   * details render flush with the top of their container and the card's own padding provides spacing.
   */
  hasImageAbove?: boolean;
  /** The "More" menu's editable-data + capture controls, grouped (see {@link BookmarkCardMenuControls}). */
  menu?: BookmarkCardMenuControls;
  /** Persist a rating-scale value edited inline on the card (only wired when the property is `editableOnCard`). */
  onSaveRating?: (propertyId: string, value: number) => void;
}

/** The zone's layout, defaulting to its natural arrangement (Table → grid, others → flex) when unset. */
function zoneLayout(zone: CardFieldZone, layouts: CardZoneLayouts | undefined): CardZoneLayout {
  return normalizeCardZoneLayout(
    layouts?.[zone as keyof CardZoneLayouts],
    zone === "card-table" ? "grid" : "flex",
  );
}

/**
 * The body of a bookmark card. Fields render in the four card-body sub-zones (single-top → labels →
 * table → single-bottom, in that fixed order), each field in the form its zone imposes and in the
 * order it sits within the zone (so the rule's field ordering is honored).
 */
export function BookmarkCardDetails({
  bookmark, properties, placements, cardZoneLayouts, bookmarkCategory, hideWebsiteForYouTube,
  hasImageAbove = false, menu = {}, onSaveRating,
}: BookmarkCardDetailsProps) {
  const {
    t,
  } = useTranslation();
  // `onSaveBoolean` lives in the menu controls but is also used for inline clickable-boolean badges.
  const {
    onSaveBoolean,
  } = menu;
  // Listings pass the rule-resolved value explicitly; other surfaces fall back to the Default rule.
  const defaultHideWebsiteForYouTube = useHideWebsiteForYouTube();
  const effectiveHideWebsiteForYouTube = hideWebsiteForYouTube ?? defaultHideWebsiteForYouTube;

  // The card header elements, now placeable fields (title link, open-URL button, "More" menu).
  const titleNode = <BookmarkTitleLink bookmark={bookmark} />;
  const externalLinkNode = <BookmarkExternalLinkButton url={bookmark.url ?? ""} />;
  // The four connector deep-link buttons (ArchiveBox / Kavita / Plex / Podcast), each null when N/A.
  const {
    archiveLinkNode, kavitaLinkNode, plexLinkNode, podcastLinkNode,
  } = useBookmarkLinkOutNodes(bookmark);
  const moreNode = (
    <BookmarkMoreMenu
      bookmark={bookmark}
      {...menu}
    />
  );

  // Single source of truth for value placement; corner-placed values (overlaid on the image) are
  // excluded here so a value isn't also shown as a badge.
  const valueItems = buildBookmarkValueItems(bookmark, properties, placements)
    .filter(item => item.corner === null);
  const valueById = new Map(valueItems.map(item => [item.id, item]));

  /** The render forms for one placed field key, or `null` when it has nothing to show. */
  function describeField(key: string): FieldRender | null {
    switch (key) {
      case "title": {
        return {
          inline: titleNode,
          block: titleNode,
          tableName: t("Title"),
          tableValue: titleNode,
        };
      }
      case "secondaryName": {
        // Only hidden when there is no secondary name at all; when present,
        // BookmarkSecondaryNameField renders the resolved secondary name (via `resolveDisplayNames`)
        // so it matches every other surface.
        if (bookmark.names.length === 0) return null;
        const secondaryNameNode = <BookmarkSecondaryNameField bookmark={bookmark} />;
        return {
          inline: secondaryNameNode,
          block: secondaryNameNode,
          tableName: t("Secondary Title"),
          tableValue: secondaryNameNode,
        };
      }
      case "externalLink": {
        return {
          inline: externalLinkNode,
          block: externalLinkNode,
          tableName: t("Link"),
          tableValue: externalLinkNode,
        };
      }
      case "archiveLink": {
        // Hidden when ArchiveBox isn't configured or the bookmark has no url.
        if (archiveLinkNode === null) return null;
        return {
          inline: archiveLinkNode,
          block: archiveLinkNode,
          tableName: t("Archive"),
          tableValue: archiveLinkNode,
        };
      }
      case "kavitaLink": {
        // Hidden when Kavita isn't configured or the bookmark isn't linked to a series.
        if (kavitaLinkNode === null) return null;
        return {
          inline: kavitaLinkNode,
          block: kavitaLinkNode,
          tableName: t("Kavita"),
          tableValue: kavitaLinkNode,
        };
      }
      case "plexLink": {
        // Hidden when Plex isn't configured or the bookmark isn't linked to an item.
        if (plexLinkNode === null) return null;
        return {
          inline: plexLinkNode,
          block: plexLinkNode,
          tableName: t("Plex"),
          tableValue: plexLinkNode,
        };
      }
      case "podcastLink": {
        // Hidden when the bookmark isn't linked to a podcast with a service URL.
        if (podcastLinkNode === null) return null;
        return {
          inline: podcastLinkNode,
          block: podcastLinkNode,
          tableName: t("Podcast"),
          tableValue: podcastLinkNode,
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
          block: <DescriptionOverflowDiv description={bookmark.description} />,
          tableName: t("Description"),
          tableValue: <span className="text-sm">{bookmark.description}</span>,
        };
      }
      case "category":
      case "website":
      case "mediaType":
      case "youtubeChannel":
      case "tags":
      case "genreMoods":
      case "locations":
      case "people":
      case "groups": {
        return describeTaxonomyField(key, {
          bookmark,
          bookmarkCategory,
          effectiveHideWebsiteForYouTube,
          placements,
        });
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
              {ratingStars(item, true, onSaveRating)}
            </span>
          );
          return {
            inline: labeled,
            block: labeled,
            tableName: item.property.name,
            tableValue: ratingStars(item, false, onSaveRating),
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
          inline: badgeNode(item, item.label, onSaveBoolean),
          block: badgeNode(item, item.label, onSaveBoolean),
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
      // The Table zone is always the fixed two-column `label : value` table — it has no layout rules.
      return (
        <dl
          key={zone}
          className="grid grid-cols-[auto_1fr] items-center gap-2"
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
      const containerClass = cardBodyContainerClass("label", layout);
      const blockClass = layout.mode === "grid" ? "col-span-2" : "w-full";
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
    // Grid arranges the non-header rows in two columns; flex honors the zone's resolved layout
    // (direction defaults to `column` so an unset layout still stacks full-width like before).
    const restClass = cardBodyContainerClass("single", layout);
    return (
      <div
        key={zone}
        className={zone === "card-single-bottom"
          ? "mt-auto space-y-2"
          : "space-y-2"}
      >
        {hasHeader
          ? (
            <div
              className={`
                flex items-start justify-between
                ${gapClass(layout)}
              `}
            >
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

  return (
    <div
      className={`
        flex h-full flex-col gap-2
        ${hasImageAbove ? "mt-2" : ""}
      `}
    >
      {CARD_BODY_ZONES.map(zone => renderZone(zone))}
    </div>
  );
}
