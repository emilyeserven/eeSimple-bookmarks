import type { BookmarkValueItem } from "../lib/bookmarkCardValues";
import type { ReactNode } from "react";

import i18n from "../i18n";
import { RatingValue } from "./RatingValue";

import { Badge } from "@/components/ui/badge";

/** Render a custom-property value badge, wiring an inline toggle for clickable booleans. */
export function badgeNode(
  item: Extract<BookmarkValueItem, { kind: "badge" }>,
  text: ReactNode,
  onSaveBoolean: ((propertyId: string, value: boolean) => void) | undefined,
): ReactNode {
  const onToggle = onSaveBoolean && item.clickableInView && item.booleanValue !== undefined
    ? () => onSaveBoolean(item.id, !item.booleanValue)
    : undefined;
  if (!onToggle) return <Badge variant="outline">{text}</Badge>;
  return (
    <button
      type="button"
      title={i18n.t("Click to toggle")}
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
export function ratingStars(
  item: Extract<BookmarkValueItem, { kind: "rating" }>,
  withLabel: boolean,
  onSaveRating: ((propertyId: string, value: number) => void) | undefined,
): ReactNode {
  // A range rating can't be set by a single click, so it renders read-only (band + caption).
  const editable = item.property.editableOnCard && !item.property.ratingAllowRange && onSaveRating !== undefined;
  const stars = (
    <RatingValue
      display={item.property.ratingDisplay ?? "stars"}
      value={item.value}
      rangeEnd={item.valueEnd}
      rangeIncludeStart={item.property.ratingRangeIncludeStart}
      max={item.property.ratingMax ?? 5}
      allowHalf={item.property.ratingAllowHalf}
      allowZero={item.property.ratingAllowZero}
      readOnly={!editable}
      onChange={editable ? next => onSaveRating(item.property.id, next) : undefined}
      label={withLabel && item.property.ratingShowLabel ? (item.property.ratingLabel ?? undefined) : undefined}
      size={16}
    />
  );
  if (!item.caption) return stars;
  return (
    <span className="inline-flex items-center gap-1.5">
      {stars}
      <span className="text-xs text-muted-foreground">{item.caption}</span>
    </span>
  );
}
