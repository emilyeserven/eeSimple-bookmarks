import type { BookmarkCardMenuControls } from "./BookmarkCardActions";
import type { FieldRender } from "./bookmarkCardTaxonomyFields";
import type { ResolvedFieldPlacement } from "../lib/bookmarkCardValues";
import type { Bookmark, CardFieldZone, CardZoneAlign, CardZoneDirection, CardZoneGap, CardZoneLayout, CardZoneLayouts, CardZoneVerticalAlign, CardZoneWrap, Category, CustomProperty } from "@eesimple/types";
import type { ReactNode } from "react";

import { CARD_BODY_ZONES, normalizeCardZoneLayout } from "@eesimple/types";

import { BookmarkArchiveLinkButton, BookmarkExternalLinkButton, BookmarkKavitaLinkButton, BookmarkMoreMenu, BookmarkPlexLinkButton, BookmarkPodcastLinkButton } from "./BookmarkCardActions";
import { badgeNode, ratingStars } from "./bookmarkCardFieldRenders";
import { describeTaxonomyField } from "./bookmarkCardTaxonomyFields";
import { BookmarkRomanizedField, BookmarkTitleLink, DescriptionOverflowDiv } from "./BookmarkTitleLink";
import { useBookmarkKavitaLink } from "../hooks/useBooks";
import { useConnectors } from "../hooks/useConnectors";
import { useBookmarkPlexLink } from "../hooks/useMovies";
import { useBookmarkPodcastLink } from "../hooks/usePodcasts";
import { useHideWebsiteForYouTube } from "../lib/bookmarkCardFields";
import { buildBookmarkValueItems } from "../lib/bookmarkCardValues";

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

/** The three render forms a card-body sub-zone imposes on the fields placed in it. */
type FieldForm = "single" | "label" | "table";

function zoneForm(zone: CardFieldZone): FieldForm {
  if (zone === "card-labels") return "label";
  if (zone === "card-table") return "table";
  return "single";
}

/** The zone's layout, defaulting to its natural arrangement (Table → grid, others → flex) when unset. */
function zoneLayout(zone: CardFieldZone, layouts: CardZoneLayouts | undefined): CardZoneLayout {
  return normalizeCardZoneLayout(
    layouts?.[zone as keyof CardZoneLayouts],
    zone === "card-table" ? "grid" : "flex",
  );
}

// Static Tailwind class maps for the per-zone gap/alignment knobs. These must be whole literal class
// strings (not interpolated) so Tailwind's content scanner keeps them.
const GAP_CLASS: Record<CardZoneGap, string> = {
  sm: "gap-1",
  md: "gap-2",
  lg: "gap-4",
};
const ALIGN_JUSTIFY: Record<CardZoneAlign, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};
const ALIGN_ITEMS: Record<CardZoneVerticalAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};
const DIRECTION_CLASS: Record<CardZoneDirection, string> = {
  row: "flex-row",
  column: "flex-col",
};
const WRAP_CLASS: Record<CardZoneWrap, string> = {
  wrap: "flex-wrap",
  nowrap: "flex-nowrap",
};

/** The gap utility class for a zone's resolved layout (defaults to `md`). */
function gapClass(layout: CardZoneLayout): string {
  return GAP_CLASS[layout.gap ?? "md"];
}

/** The flex main-axis justification class for a zone's resolved layout (defaults to `start`). */
function justifyClass(layout: CardZoneLayout): string {
  return ALIGN_JUSTIFY[layout.align ?? "start"];
}

/**
 * The cross-axis `items-*` class for a zone's resolved layout. `fallback` is the prior hard-coded
 * default for that container (e.g. `center` for the row zones) so an unset `alignItems` keeps today's look.
 */
function alignItemsClass(layout: CardZoneLayout, fallback: CardZoneVerticalAlign): string {
  return ALIGN_ITEMS[layout.alignItems ?? fallback];
}

/**
 * The flex direction + wrap classes for a zone's resolved layout. `fallbackDirection` is the prior
 * hard-coded direction for that container (`row` for the label/table zones, `column` for the
 * single-column zones) so an unset `direction` keeps today's look.
 */
function flexFlowClass(layout: CardZoneLayout, fallbackDirection: CardZoneDirection = "row"): string {
  return `${DIRECTION_CLASS[layout.direction ?? fallbackDirection]} ${WRAP_CLASS[layout.wrap ?? "wrap"]}`;
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
  // `onSaveBoolean` lives in the menu controls but is also used for inline clickable-boolean badges.
  const {
    onSaveBoolean,
  } = menu;
  // Listings pass the rule-resolved value explicitly; other surfaces fall back to the Default rule.
  const defaultHideWebsiteForYouTube = useHideWebsiteForYouTube();
  const effectiveHideWebsiteForYouTube = hideWebsiteForYouTube ?? defaultHideWebsiteForYouTube;

  // ArchiveBox base URL (link-out only); the archiveLink field renders nothing when unset.
  const {
    data: connectors,
  } = useConnectors();
  const archiveBaseUrl = connectors?.archiveBox.baseUrl ?? null;

  // The card header elements, now placeable fields (title link, open-URL button, "More" menu).
  // BookmarkTitleLink owns its own useViewPanelClick / useSidebarOpenModifier hooks.
  const titleNode = <BookmarkTitleLink bookmark={bookmark} />;
  const externalLinkNode = <BookmarkExternalLinkButton url={bookmark.url ?? ""} />;
  const archiveLinkNode = archiveBaseUrl !== null && bookmark.url
    ? (
      <BookmarkArchiveLinkButton
        baseUrl={archiveBaseUrl}
        url={bookmark.url}
      />
    )
    : null;
  // Kavita deep link; the kavitaLink field renders nothing when unconfigured or unlinked — resolved
  // through the linked Book when one carries the Kavita linkage, else the bookmark's legacy columns.
  const kavitaBaseUrl = connectors?.kavita.enabled ? connectors.kavita.baseUrl : null;
  const kavitaLink = useBookmarkKavitaLink(bookmark);
  const kavitaLinkNode = kavitaBaseUrl !== null && kavitaLink !== null && kavitaLink.libraryId !== null
    ? (
      <BookmarkKavitaLinkButton
        baseUrl={kavitaBaseUrl}
        libraryId={kavitaLink.libraryId}
        seriesId={kavitaLink.seriesId}
      />
    )
    : null;
  // Plex deep link; the plexLink field renders nothing when unconfigured, unlinked, or the server's
  // machineIdentifier isn't known yet — resolved through whichever Plex-backed taxonomy is linked,
  // else the bookmark's legacy columns.
  const plexConnector = connectors?.plex.enabled ? connectors.plex : null;
  const plexLink = useBookmarkPlexLink(bookmark);
  const plexLinkNode = plexConnector?.baseUrl && plexConnector.machineIdentifier && plexLink !== null
    ? (
      <BookmarkPlexLinkButton
        baseUrl={plexConnector.baseUrl}
        machineIdentifier={plexConnector.machineIdentifier}
        ratingKey={plexLink.ratingKey}
      />
    )
    : null;
  // Podcast deep link; renders nothing when the bookmark isn't linked to a podcast or none of its
  // services has a URL. Public URLs, so no connector gating.
  const podcastLink = useBookmarkPodcastLink(bookmark);
  const podcastLinkNode = podcastLink !== null
    ? (
      <BookmarkPodcastLinkButton
        url={podcastLink.url}
        label={podcastLink.label}
      />
    )
    : null;
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
          tableName: "Title",
          tableValue: titleNode,
        };
      }
      case "romanizedName": {
        // Only hidden when there is no romanized value at all; when present, BookmarkRomanizedField
        // renders the toggle-aware secondary (romanized, or the native title when "show romanized
        // first" is on) so the title/romanized pair matches every other surface.
        if (!bookmark.romanizedName) return null;
        const romanizedNameNode = <BookmarkRomanizedField bookmark={bookmark} />;
        return {
          inline: romanizedNameNode,
          block: romanizedNameNode,
          tableName: "Romanized Title",
          tableValue: romanizedNameNode,
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
      case "archiveLink": {
        // Hidden when ArchiveBox isn't configured or the bookmark has no url.
        if (archiveLinkNode === null) return null;
        return {
          inline: archiveLinkNode,
          block: archiveLinkNode,
          tableName: "Archive",
          tableValue: archiveLinkNode,
        };
      }
      case "kavitaLink": {
        // Hidden when Kavita isn't configured or the bookmark isn't linked to a series.
        if (kavitaLinkNode === null) return null;
        return {
          inline: kavitaLinkNode,
          block: kavitaLinkNode,
          tableName: "Kavita",
          tableValue: kavitaLinkNode,
        };
      }
      case "plexLink": {
        // Hidden when Plex isn't configured or the bookmark isn't linked to an item.
        if (plexLinkNode === null) return null;
        return {
          inline: plexLinkNode,
          block: plexLinkNode,
          tableName: "Plex",
          tableValue: plexLinkNode,
        };
      }
      case "podcastLink": {
        // Hidden when the bookmark isn't linked to a podcast with a service URL.
        if (podcastLinkNode === null) return null;
        return {
          inline: podcastLinkNode,
          block: podcastLinkNode,
          tableName: "Podcast",
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
          tableName: "Description",
          tableValue: <span className="text-sm">{bookmark.description}</span>,
        };
      }
      case "category":
      case "website":
      case "mediaType":
      case "language":
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
      const containerClass = layout.mode === "grid"
        ? `grid grid-cols-2 ${alignItemsClass(layout, "center")} ${gapClass(layout)}`
        : `flex ${flexFlowClass(layout)} ${alignItemsClass(layout, "center")} ${gapClass(layout)} ${justifyClass(layout)}`;
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
    const restClass = layout.mode === "grid"
      ? `grid grid-cols-2 ${alignItemsClass(layout, "stretch")} ${gapClass(layout)}`
      : `flex ${flexFlowClass(layout, "column")} ${alignItemsClass(layout, "stretch")} ${justifyClass(layout)} ${gapClass(layout)}`;
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
