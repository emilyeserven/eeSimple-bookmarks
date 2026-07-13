import type { ReactNode } from "react";

import { Eye, EyeOff, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A ghost icon button revealed on row hover, used for the standard Edit / Info controls. Pass a
 * single typed `<Link>` (with its own `onClick` panel-aware handler + icon + sr-only label) as the
 * child; `asChild` forwards the button styling onto it.
 */
export function HoverIconButton({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="
        shrink-0 opacity-0 transition-opacity
        group-hover:opacity-100
        focus-visible:opacity-100
      "
    >
      {children}
    </Button>
  );
}

/**
 * The hover Eye / EyeOff control that hides or unhides a (usually built-in) taxonomy value from
 * pickers/facets. Pass the row's current `hidden` state, its `name` (for the accessible label), and
 * an `onToggle` that flips the flag via the entity's update mutation. Rendered in the card's
 * `renderExtra` slot so it sits alongside Edit / Info.
 */
export function HideToggleButton({
  hidden, name, onToggle,
}: {
  hidden: boolean;
  name: string;
  onToggle: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <HoverIconButton>
      <button
        type="button"
        onClick={onToggle}
        title={hidden ? t("Show in pickers") : t("Hide from pickers")}
      >
        {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        <span className="sr-only">
          {hidden
            ? t("Show {{name}}", {
              name,
            })
            : t("Hide {{name}}", {
              name,
            })}
        </span>
      </button>
    </HoverIconButton>
  );
}

/**
 * The hover Star control that stars / un-stars a category or tag from its listing. Pass the row's
 * current `isFavorite` state, its `name` (for the accessible label), and an `onToggle` that flips the
 * flag via the entity's update mutation. Starred items surface in the sidebar Categories / Tags
 * flyouts. Rendered in the card's `renderExtra` slot so it sits alongside Edit / Info.
 */
export function FavoriteToggleButton({
  isFavorite, name, onToggle,
}: {
  isFavorite: boolean;
  name: string;
  onToggle: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <HoverIconButton>
      <button
        type="button"
        onClick={onToggle}
        title={isFavorite ? t("Unstar") : t("Star")}
      >
        <Star
          className={cn("size-4", isFavorite && "fill-current text-yellow-500")}
        />
        <span className="sr-only">
          {isFavorite
            ? t("Unstar {{name}}", {
              name,
            })
            : t("Star {{name}}", {
              name,
            })}
        </span>
      </button>
    </HoverIconButton>
  );
}

interface StandardListingCardProps {
  /** Far-left icon/image node (caller builds the full wrapper incl. shape + fallback). Optional. */
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  /** Extra inline node next to the title (e.g. a "Built-in" Badge). */
  titleAdornment?: ReactNode;
  /** Always-visible count badge. When `0`, the card is de-emphasized (still clickable). */
  count?: number;
  /**
   * Primary card-body navigation. Caller builds the typed `<Link>` (usually a plain `/bookmarks`
   * filter link — NOT panel-aware), receiving the className to apply and the icon + title content.
   */
  renderPrimaryLink: (className: string, children: ReactNode) => ReactNode;
  /** Hover Edit pencil — caller builds the panel-aware `<Link>` wrapped in `<HoverIconButton>`. */
  renderEdit: () => ReactNode;
  /** Hover Info button — same shape. Omit to render no Info button (e.g. Autofill). */
  renderInfo?: () => ReactNode;
  /** Extra hover action rendered before Edit (e.g. a per-row image fetch button). Omit for none. */
  renderExtra?: () => ReactNode;
  /** Optional content rendered below the main row (e.g. a CategoryPill). */
  footer?: ReactNode;
  /** When true, clicking the card body toggles selection (shown when `inSelectionMode` is true). */
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  /** When true, the card body becomes a click-to-select button (no checkbox). Gate on the listing's selection mode. */
  inSelectionMode?: boolean;
}

/**
 * The standardized listing-row card shared by every entity listing page (Categories, Websites,
 * YouTube Channels, Media Types, Tags, Property Groups, Relationship Types, Autofill): an
 * always-far-left icon, a vertically-centered info column, a plain card-body link (usually to the
 * filtered `/bookmarks` list), hover-revealed Edit (pencil) + Info buttons, an always-visible count
 * badge, and zero-count de-emphasis. See the `standard-listing-card` skill for the full recipe and
 * the documented exceptions.
 */
export function StandardListingCard({
  icon, title, subtitle, titleAdornment, count,
  renderPrimaryLink, renderEdit, renderInfo, renderExtra, footer,
  selectable = false, selected = false, onSelectToggle, inSelectionMode = false,
}: StandardListingCardProps) {
  const {
    t,
  } = useTranslation();
  // Zero-count items are de-emphasized but stay clickable. Items without a count are not muted.
  const muted = count === 0;

  const linkChildren = (
    <>
      {icon}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium">
          <span className="min-w-0 truncate">{title}</span>
          {titleAdornment}
        </p>
        {subtitle !== undefined && subtitle !== ""
          ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          : null}
      </div>
    </>
  );

  return (
    <RowCard
      className={cn(
        `
          group transition-colors
          hover:bg-accent
        `,
        muted && "opacity-60",
        selected && "ring-2 ring-primary",
      )}
    >
      {/* items-center keeps the icon + controls vertically centered even on tall/wrapping cards. */}
      <div className="flex items-center gap-1">
        {(inSelectionMode && selectable)
          ? (
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left"
              aria-label={selected
                ? t("Deselect {{title}}", {
                  title,
                })
                : t("Select {{title}}", {
                  title,
                })}
              onClick={() => onSelectToggle?.()}
            >
              {linkChildren}
            </button>
          )
          : renderPrimaryLink("flex min-w-0 flex-1 items-center gap-3 p-4", linkChildren)}
        <div className="flex shrink-0 items-center gap-1 pr-4">
          {renderExtra?.()}
          {renderEdit()}
          {renderInfo?.()}
          {count !== undefined
            ? <Badge variant="secondary">{count}</Badge>
            : null}
        </div>
      </div>
      {footer !== undefined && footer !== null
        ? <div className="px-4 pb-2 pl-15">{footer}</div>
        : null}
    </RowCard>
  );
}
