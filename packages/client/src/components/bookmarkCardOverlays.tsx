import type { CardOverlayItem } from "./CardImageOverlays";
import type { BookmarkValueItem, ResolvedFieldPlacement } from "../lib/bookmarkCardValues";
import type { Bookmark, Category } from "@eesimple/types";
import type { ReactNode } from "react";

import { Globe, MonitorPlay } from "lucide-react";

import { StarRating } from "./StarRating";
import { STANDARD_CARD_FIELDS } from "../lib/bookmarkCardFieldDefs";
import { standardFieldOverlayLabel } from "../lib/bookmarkCardValues";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";

/** A translucent corner-overlay badge composing an optional icon/image with optional text. */
function overlayBadge(icon: ReactNode, text: ReactNode): ReactNode {
  return (
    <Badge
      variant="secondary"
      className="
        inline-flex items-center gap-1 bg-background/85 backdrop-blur-sm
      "
    >
      {icon}
      {text}
    </Badge>
  );
}

/** The icon/image shown for a standard field in an image overlay, or `null` when it has none. */
function standardFieldOverlayIcon(
  bookmark: Bookmark,
  key: string,
  category: Category | undefined,
): ReactNode {
  switch (key) {
    case "category":
      return category
        ? (
          <CategoryIcon
            name={category.icon}
            className="size-3 shrink-0"
          />
        )
        : null;
    case "website":
      return bookmark.website?.imageUrl
        ? (
          <img
            src={bookmark.website.imageUrl}
            alt=""
            className="size-3 shrink-0 object-contain"
          />
        )
        : <Globe className="size-3 shrink-0" />;
    case "mediaType":
      return bookmark.mediaType
        ? (
          <CategoryIcon
            name={bookmark.mediaType.icon}
            className="size-3 shrink-0"
          />
        )
        : null;
    case "youtubeChannel":
      return bookmark.youtubeChannel?.imageUrl
        ? (
          <img
            src={bookmark.youtubeChannel.imageUrl}
            alt=""
            className="size-3 shrink-0 rounded-full object-cover"
          />
        )
        : <MonitorPlay className="size-3 shrink-0" />;
    default:
      return null;
  }
}

/**
 * Render a custom-property value item as a translucent corner-overlay node. Ratings show compact
 * stars; image values show a thumbnail (unless `hideIcon`) plus the property name (unless
 * `hideLabel`); other values show their formatted label. Returns `null` when nothing remains to show.
 */
function valueItemOverlayNode(item: BookmarkValueItem): ReactNode {
  if (item.kind === "rating") {
    return (
      <div
        className="rounded-md bg-background/85 px-1.5 py-0.5 backdrop-blur-sm"
      >
        <StarRating
          value={item.value}
          max={item.property.ratingMax ?? 5}
          allowHalf={item.property.ratingAllowHalf}
          allowZero={item.property.ratingAllowZero}
          readOnly
          size={12}
        />
      </div>
    );
  }
  const icon = !item.hideIcon && item.imageUrl
    ? (
      <img
        src={item.imageUrl}
        alt=""
        className="size-4 shrink-0 rounded-sm object-cover"
      />
    )
    : null;
  // For an image value the label is the property name; honor hideLabel. Non-image labels already
  // reflect hideLabel (built in buildBookmarkValueItems).
  const text = item.imageUrl
    ? (item.hideLabel ? null : item.name)
    : item.label;
  if (!icon && !text) return null;
  return overlayBadge(icon, text);
}

/** Wrap an interactive action node (Open Link / More) in a translucent corner container. */
function overlayAction(node: ReactNode): ReactNode {
  return (
    <div className="rounded-md bg-background/85 backdrop-blur-sm">
      {node}
    </div>
  );
}

/** The interactive header action nodes a caller can place in image corners. */
export interface OverlayActionNodes {
  externalLink?: ReactNode;
  more?: ReactNode;
}

/**
 * Assemble the image-corner overlay items for a card: the custom-property values placed in a corner
 * (rendered via {@link valueItemOverlayNode}), the standard fields placed in a corner (icon + label per
 * the rule's `hideIcon`/`hideLabel`), and the interactive header actions (Open Link / More) when their
 * nodes are supplied and they're placed in a corner. Items that resolve to nothing visible are skipped.
 * Caller renders these only when the card has an image; without an image the same fields fall back to
 * the card body via `BookmarkCardDetails`.
 */
export function buildCardOverlayItems(
  bookmark: Bookmark,
  valueItems: BookmarkValueItem[],
  placements: Map<string, ResolvedFieldPlacement>,
  bookmarkCategory: Category | undefined,
  actionNodes: OverlayActionNodes = {},
): CardOverlayItem[] {
  const overlayItems: CardOverlayItem[] = [];
  for (const item of valueItems) {
    if (item.corner === null) continue;
    const node = valueItemOverlayNode(item);
    if (!node) continue;
    overlayItems.push({
      key: item.id,
      corner: item.corner,
      scale: item.scale,
      mobileScale: item.mobileScale,
      node,
    });
  }
  // The interactive header actions render as their button/menu node (hideIcon/hideLabel don't apply —
  // they'd hide the whole control). They're only laid out when their node is wired and placed in a corner.
  const actionByKey: Record<string, ReactNode> = {
    externalLink: actionNodes.externalLink,
    more: actionNodes.more,
  };
  for (const field of STANDARD_CARD_FIELDS) {
    const placement = placements.get(field.key);
    if (!placement || placement.corner === null) continue;
    const actionNode = actionByKey[field.key];
    if (actionNode) {
      overlayItems.push({
        key: field.key,
        corner: placement.corner,
        scale: placement.scale,
        mobileScale: placement.mobileScale,
        node: overlayAction(actionNode),
      });
      continue;
    }
    const label = standardFieldOverlayLabel(bookmark, field.key, bookmarkCategory?.name ?? null);
    if (!label) continue;
    // Icons/images show by default; the rule's per-field checkboxes hide the icon and/or the text.
    const icon = placement.hideIcon ? null : standardFieldOverlayIcon(bookmark, field.key, bookmarkCategory);
    const text = placement.hideLabel ? null : label;
    if (!icon && !text) continue;
    overlayItems.push({
      key: field.key,
      corner: placement.corner,
      scale: placement.scale,
      mobileScale: placement.mobileScale,
      node: overlayBadge(icon, text),
    });
  }
  return overlayItems;
}
