import type { TermDisplayProps } from "./bookmarkCardTermBadges";
import type { BookmarkGroup } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { TaxonomyBadgeRow, TaxonomyLinkList } from "./bookmarkCardTermBadges";

import { Badge } from "@/components/ui/badge";
import i18n from "@/i18n";

interface GroupsBoxProps extends TermDisplayProps {
  groups: BookmarkGroup[];
}

/** The count-form label for a bookmark's groups, e.g. "5 groups". */
function groupsCountLabel(count: number): string {
  return i18n.t("{{count}} groups", {
    count,
  });
}

/**
 * A bookmark's group-credit badges — each renders standalone so it flows alongside the card's other
 * pills (category, media type, website, …) in the `card-labels` zone's flex row. Mirrors
 * {@link BookmarkLocationBadges}. This is the multi-valued `bookmark.groups` creator-credit relation.
 * Honors the `maxTerms` / `collapseToCount` term-display knobs.
 */
export function BookmarkGroupBadges({
  groups, maxTerms = null, collapseToCount = false,
}: GroupsBoxProps) {
  return (
    <TaxonomyBadgeRow
      items={groups}
      keyOf={group => group.id}
      icon={Users}
      countLabel={groupsCountLabel}
      maxTerms={maxTerms}
      collapseToCount={collapseToCount}
      renderBadge={group => (
        <Link
          to="/taxonomies/groups/$groupSlug"
          params={{
            groupSlug: group.slug,
          }}
          title={group.name}
        >
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-1"
          >
            <Users className="size-3 shrink-0" />
            {group.name}
          </Badge>
        </Link>
      )}
    />
  );
}

/**
 * Inline, comma-separated group links — the `card-table` zone's value form of a bookmark's groups.
 * Each name links to the group's page like the {@link BookmarkGroupBadges} badges, but laid out as
 * plain inline text to fit the table value column. Mirrors {@link BookmarkTagLinks}.
 */
export function BookmarkGroupLinks({
  groups, maxTerms = null, collapseToCount = false,
}: GroupsBoxProps) {
  return (
    <TaxonomyLinkList
      items={groups}
      keyOf={group => group.id}
      countLabel={groupsCountLabel}
      maxTerms={maxTerms}
      collapseToCount={collapseToCount}
      renderLink={group => (
        <Link
          to="/taxonomies/groups/$groupSlug"
          params={{
            groupSlug: group.slug,
          }}
          title={group.name}
          className="
            text-primary
            hover:underline
          "
        >
          {group.name}
        </Link>
      )}
    />
  );
}
