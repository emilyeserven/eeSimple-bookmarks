import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { RowCard } from "@/components/ui/card";

interface RowListItemProps {
  /** Optional left icon (caller builds the full <span> wrapper, including rounded shape and fallback). */
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  /** Count badge shown at the far right, always visible. */
  badge?: number;
  /** Hover-revealed control: a DropdownMenu trigger or a pencil Button. Caller owns the opacity classes. */
  menu: ReactNode;
  /** Optional content rendered below the main flex row (e.g. a CategoryPill). */
  categoryPill?: ReactNode;
  /**
   * Render prop: caller builds the typed TanStack Router Link, receiving the className to apply and
   * the icon + title/subtitle content as children. Keeps route-specific type-safety at the call site.
   */
  renderLink: (className: string, children: ReactNode) => ReactNode;
}

/**
 * Standard listing-row shell: RowCard with a flex row containing a navigation link (with optional
 * icon + title/subtitle), a hover-revealed menu control, and a count badge. Used by WebsiteListItem,
 * YouTubeChannelListItem, and PropertyGroupListItem.
 */
export function RowListItem({
  icon, title, subtitle, badge, menu, categoryPill, renderLink,
}: RowListItemProps) {
  const linkClassName = icon !== undefined
    ? "flex min-w-0 flex-1 items-center gap-3"
    : "min-w-0 flex-1";

  const linkChildren = (
    <>
      {icon !== undefined && icon}
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {subtitle !== undefined && (
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </>
  );

  return (
    <RowCard
      className="
        group transition-colors
        hover:bg-accent
      "
    >
      <div className="flex items-center gap-3 p-4">
        {renderLink(linkClassName, linkChildren)}
        {menu}
        {badge !== undefined
          ? <Badge variant="secondary">{badge}</Badge>
          : null}
      </div>
      {categoryPill !== undefined && (
        <div className="px-4 pb-2 pl-15">
          {categoryPill}
        </div>
      )}
    </RowCard>
  );
}
