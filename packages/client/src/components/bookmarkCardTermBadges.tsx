import type { TermDisplayOptions } from "@/lib/cardTaxonomyDisplay";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Fragment } from "react";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import i18n from "@/i18n";
import { resolveTermDisplay } from "@/lib/cardTaxonomyDisplay";

/**
 * The collapsed "count" form of a multi-value taxonomy field on a bookmark card: the field's icon +
 * the total number of terms (e.g. "🏷 5"), shown when the field's `collapseToCount` knob is on and it
 * is over its `maxTerms` limit. Rendered in place of the term names.
 */
export function TaxonomyCountBadge({
  icon: Icon, count, title,
}: {
  icon: LucideIcon;
  count: number;
  /** Accessible/hover title, e.g. "5 tags". */
  title: string;
}) {
  return (
    <Badge
      variant="secondary"
      className="inline-flex items-center gap-1"
      title={title}
    >
      <Icon className="size-3 shrink-0" />
      {count}
    </Badge>
  );
}

/**
 * The clickable "+N more" indicator appended after the visible term names when a multi-value taxonomy
 * field is capped by its `maxTerms` knob (and not collapsing to a count). Clicking it opens a popover
 * listing the hidden terms (`children` — the rendered hidden badges/links). `stopPropagation` keeps a
 * click on a listing card from also triggering the card's own navigation.
 */
export function MoreTermsBadge({
  hidden, children,
}: {
  hidden: number;
  /** The rendered hidden terms shown inside the popover. */
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        asChild
      >
        <button
          type="button"
          aria-label={i18n.t("Show {{count}} more", {
            count: hidden,
          })}
          className="inline-flex"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <Badge
            variant="outline"
            className="
              cursor-pointer text-muted-foreground
              hover:bg-accent hover:text-foreground
            "
          >
            {i18n.t("+{{count}} more", {
              count: hidden,
            })}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="
          flex max-h-64 w-auto max-w-xs flex-col items-start gap-1
          overflow-y-auto
        "
        onPointerDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** The per-field term-display knobs a multi-value taxonomy card field reads off its placement. */
export interface TermDisplayProps {
  /** Cap on visible term names (the `maxTerms` placement knob; `null` = no cap). */
  maxTerms?: number | null;
  /** Collapse to the field icon + count when over the limit (the `collapseToCount` placement knob). */
  collapseToCount?: boolean;
}

interface TaxonomyBadgeRowProps<T> extends TermDisplayProps {
  items: T[];
  keyOf: (item: T) => string;
  /** Render one term's badge (the link-wrapped, icon-prefixed pill). */
  renderBadge: (item: T) => ReactNode;
  /** The field icon used by the collapsed count form. */
  icon: LucideIcon;
  /** The count-form title/label, e.g. `(n) => t("{{count}} people", { count: n })`. */
  countLabel: (count: number) => string;
}

/**
 * A flex row of a multi-value taxonomy field's term badges (People / Groups / Locations / Genres &
 * Moods on a bookmark card), honoring the field's `maxTerms` / `collapseToCount` knobs: shows every
 * badge, the first N + a "+N more" badge, or a single icon + count badge.
 */
export function TaxonomyBadgeRow<T>({
  items, keyOf, renderBadge, icon, countLabel, maxTerms = null, collapseToCount = false,
}: TaxonomyBadgeRowProps<T>) {
  const opts: TermDisplayOptions = {
    maxTerms,
    collapseToCount,
  };
  const display = resolveTermDisplay(items.length, opts);
  if (display.mode === "count") {
    return (
      <div className="flex flex-wrap items-center gap-1">
        <TaxonomyCountBadge
          icon={icon}
          count={display.total}
          title={countLabel(display.total)}
        />
      </div>
    );
  }
  const visible = display.mode === "limit" ? items.slice(0, display.visible) : items;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map(item => <Fragment key={keyOf(item)}>{renderBadge(item)}</Fragment>)}
      {display.mode === "limit"
        ? (
          <MoreTermsBadge hidden={display.hidden}>
            {items.slice(display.visible).map(item => (
              <Fragment key={keyOf(item)}>{renderBadge(item)}</Fragment>
            ))}
          </MoreTermsBadge>
        )
        : null}
    </div>
  );
}

interface TaxonomyLinkListProps<T> extends TermDisplayProps {
  items: T[];
  keyOf: (item: T) => string;
  /** Render one term's inline link (plain text form for the `card-table` value column). */
  renderLink: (item: T) => ReactNode;
  /** The count-form label, e.g. `(n) => t("{{count}} people", { count: n })`. */
  countLabel: (count: number) => string;
}

/**
 * The comma-separated inline link form of a multi-value taxonomy field (the `card-table` zone's value
 * column), honoring the field's `maxTerms` / `collapseToCount` knobs: every name, the first N + a
 * "+N more" suffix, or a bare "{count} people"-style total.
 */
export function TaxonomyLinkList<T>({
  items, keyOf, renderLink, countLabel, maxTerms = null, collapseToCount = false,
}: TaxonomyLinkListProps<T>) {
  const opts: TermDisplayOptions = {
    maxTerms,
    collapseToCount,
  };
  const display = resolveTermDisplay(items.length, opts);
  if (display.mode === "count") {
    return <span className="text-sm">{countLabel(display.total)}</span>;
  }
  const visible = display.mode === "limit" ? items.slice(0, display.visible) : items;
  return (
    <span className="text-sm">
      {visible.map((item, index) => (
        <Fragment key={keyOf(item)}>
          {index > 0 ? ", " : null}
          {renderLink(item)}
        </Fragment>
      ))}
      {display.mode === "limit"
        ? (
          <>
            {" "}
            <MoreTermsBadge hidden={display.hidden}>
              {items.slice(display.visible).map(item => (
                <div key={keyOf(item)}>{renderLink(item)}</div>
              ))}
            </MoreTermsBadge>
          </>
        )
        : null}
    </span>
  );
}
