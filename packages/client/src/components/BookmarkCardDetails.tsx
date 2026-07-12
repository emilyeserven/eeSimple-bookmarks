import type { BookmarkCardMenuControls } from "./BookmarkCardActions";
import type { FieldRender } from "./bookmarkCardTaxonomyFields";
import type { ResolvedFieldPlacement } from "../lib/bookmarkCardValues";
import type { RenderBodySection } from "../lib/cardBodySections";
import type { Bookmark, CardZoneLayouts, Category, CustomProperty } from "@eesimple/types";
import type { ReactNode } from "react";

import { useTranslation } from "react-i18next";

import { BookmarkExternalLinkButton, BookmarkMoreMenu } from "./BookmarkCardActions";
import { badgeNode, ratingStars } from "./bookmarkCardFieldRenders";
import { describeTaxonomyField } from "./bookmarkCardTaxonomyFields";
import { BookmarkSecondaryNameField, BookmarkTitleLink, DescriptionOverflowDiv } from "./BookmarkTitleLink";
import { useBookmarkLinkOutNodes } from "./useBookmarkLinkOutNodes";
import { useHideWebsiteForYouTube } from "../lib/bookmarkCardFields";
import { buildBookmarkValueItems } from "../lib/bookmarkCardValues";
import { bodySectionsFromZones } from "../lib/cardBodySections";
import { cardBodyContainerClass, gapClass } from "../lib/cardZoneLayoutClasses";
import { formatDateTimeValue } from "../lib/datetime";

import { Badge } from "@/components/ui/badge";

/** The card header field keys, rendered as a justified header row when co-located in a single zone. */
const HEADER_FIELD_KEYS = new Set(["title", "externalLink", "more"]);

/** Field keys routed to the shared taxonomy field renderer. */
const TAXONOMY_FIELD_KEYS = new Set([
  "category", "website", "mediaType", "youtubeChannel", "tags", "genreMoods", "locations", "people", "groups",
]);

/** A field whose inline/block/table cells all render the same node. */
function uniformFieldRender(node: ReactNode, tableName: string): FieldRender {
  return {
    inline: node,
    block: node,
    tableName,
    tableValue: node,
  };
}

interface BookmarkCardDetailsProps {
  bookmark: Bookmark;
  properties: CustomProperty[];
  /** Resolved field placements; a field is shown in the body when its placement's corner is `null`. */
  placements: Map<string, ResolvedFieldPlacement>;
  /** Resolved per-body-zone layout (flex vs grid); when omitted each zone uses its default arrangement. */
  cardZoneLayouts?: CardZoneLayouts;
  /**
   * The ordered card-body render sections. Listing cards pass the dynamic card-display config's
   * resolved sections; when omitted the body is derived from the legacy fixed four-zone model (via
   * `placements`/`cardZoneLayouts`), reproducing the pre-refactor render for homepage/other surfaces.
   */
  bodySections?: RenderBodySection[];
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

/**
 * The body of a bookmark card. Fields render in an ordered list of sections (listing cards use the
 * dynamic card-display config; other surfaces fall back to the legacy four fixed sub-zones), each
 * field in the form its section imposes and in the order it sits within the section (so the
 * configured field ordering is honored).
 */
export function BookmarkCardDetails({
  bookmark, properties, placements, cardZoneLayouts, bodySections, bookmarkCategory, hideWebsiteForYouTube,
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

  // Fields whose inline/block/table cells all render the same node (built once per render). A `null`
  // node means the field is hidden — the link-out fields are null when their connector isn't
  // configured / the bookmark isn't linked.
  const uniformFields: Record<string, { node: ReactNode | null;
    tableName: string; }> = {
    title: {
      node: titleNode,
      tableName: t("Title"),
    },
    externalLink: {
      node: externalLinkNode,
      tableName: t("Link"),
    },
    archiveLink: {
      node: archiveLinkNode,
      tableName: t("Archive"),
    },
    kavitaLink: {
      node: kavitaLinkNode,
      tableName: t("Kavita"),
    },
    plexLink: {
      node: plexLinkNode,
      tableName: t("Plex"),
    },
    podcastLink: {
      node: podcastLinkNode,
      tableName: t("Podcast"),
    },
    more: {
      node: moreNode,
      tableName: "",
    },
    createdAt: {
      node: <span className="text-sm text-muted-foreground">{formatDateTimeValue(bookmark.createdAt, "date")}</span>,
      tableName: t("Date Added"),
    },
    updatedAt: {
      node: bookmark.updatedAt
        ? <span className="text-sm text-muted-foreground">{formatDateTimeValue(bookmark.updatedAt, "date")}</span>
        : null,
      tableName: t("Date Updated"),
    },
  };

  /** The default arm: a bookmark value item (rating / image thumbnail / formatted badge). */
  function describeValueField(key: string): FieldRender | null {
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
    if (item.kind === "progress") {
      // Body zones show the text only (no ring); the two knobs already control count/unit.
      if (!item.text) return null;
      const label = item.hideLabel ? item.text : `${item.property.name}: ${item.text}`;
      const pill = <Badge variant="outline">{label}</Badge>;
      return {
        inline: pill,
        block: pill,
        tableName: item.property.name,
        tableValue: <span className="text-sm">{item.text}</span>,
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

  /** The render forms for one placed field key, or `null` when it has nothing to show. */
  function describeField(key: string): FieldRender | null {
    const uniform = uniformFields[key];
    if (uniform) return uniform.node === null ? null : uniformFieldRender(uniform.node, uniform.tableName);
    if (TAXONOMY_FIELD_KEYS.has(key)) {
      return describeTaxonomyField(key, {
        bookmark,
        bookmarkCategory,
        effectiveHideWebsiteForYouTube,
        placements,
      });
    }
    switch (key) {
      case "secondaryName": {
        // Only hidden when there is no secondary name at all; when present,
        // BookmarkSecondaryNameField renders the resolved secondary name (via `resolveDisplayNames`)
        // so it matches every other surface.
        if (bookmark.names.length === 0) return null;
        return uniformFieldRender(<BookmarkSecondaryNameField bookmark={bookmark} />, t("Secondary Title"));
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
      case "url": {
        if (!bookmark.url) return null;
        return uniformFieldRender(
          (
            <a
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              className="
                block max-w-full truncate text-sm text-muted-foreground
                underline-offset-2
                hover:underline
              "
            >{bookmark.url}
            </a>
          ),
          t("URL"),
        );
      }
      case "secondaryUrl": {
        if (!bookmark.secondaryUrl) return null;
        return uniformFieldRender(
          (
            <a
              href={bookmark.secondaryUrl}
              target="_blank"
              rel="noreferrer"
              className="
                block max-w-full truncate text-sm text-muted-foreground
                underline-offset-2
                hover:underline
              "
            >{bookmark.secondaryUrl}
            </a>
          ),
          t("Download URL"),
        );
      }
      default: {
        return describeValueField(key);
      }
    }
  }

  // Listing cards pass explicit dynamic sections; other surfaces derive the legacy fixed four-zone
  // layout from the placements (byte-identical to the pre-refactor render).
  const sections = bodySections ?? bodySectionsFromZones(placements, cardZoneLayouts);

  function renderSection(section: RenderBodySection): ReactNode {
    const entries = section.fieldKeys
      .map(key => ({
        key,
        render: describeField(key),
        hideLabel: placements.get(key)?.hideLabel ?? false,
      }))
      .filter((entry): entry is { key: string;
        render: FieldRender;
        hideLabel: boolean; } => entry.render !== null);
    if (entries.length === 0) return null;

    const {
      key: sectionKey, form, layout,
    } = section;
    if (form === "table") {
      // The Table form is always the fixed two-column `label : value` table — it has no layout rules.
      return (
        <dl
          key={sectionKey}
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
          key={sectionKey}
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

    // Stacked (single) form: full-width stacked rows. The header fields (title + action buttons),
    // when co-located here, render as a justified header row (title left, buttons right) reproducing the
    // old fixed card header; the remaining fields stack below.
    const titleEntry = entries.find(entry => entry.key === "title");
    const actionEntries = entries.filter(entry => entry.key === "externalLink" || entry.key === "more");
    const restEntries = entries.filter(entry => !HEADER_FIELD_KEYS.has(entry.key));
    const hasHeader = titleEntry !== undefined || actionEntries.length > 0;
    // Grid arranges the non-header rows in two columns; flex honors the section's resolved layout
    // (direction defaults to `column` so an unset layout still stacks full-width like before).
    const restClass = cardBodyContainerClass("single", layout);
    return (
      <div
        key={sectionKey}
        className={section.pinBottom
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
      {sections.map(section => renderSection(section))}
    </div>
  );
}
